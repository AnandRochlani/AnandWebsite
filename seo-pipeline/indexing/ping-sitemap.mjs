#!/usr/bin/env node
/**
 * "Ping" the search engines that the sitemap changed — the 2026 way.
 *
 * READ THIS BEFORE YOU GO LOOKING FOR /ping?sitemap=:
 *   - Google RETIRED https://www.google.com/ping?sitemap=... in June 2023. It now
 *     returns HTTP 404 and does nothing. Google discovers sitemaps via robots.txt
 *     and Search Console only.
 *   - Bing RETIRED https://www.bing.com/ping?sitemap=... too and points everyone at
 *     IndexNow / Bing Webmaster Tools.
 * This script therefore does NOT call those endpoints. It:
 *   1. validates that the live sitemap is fetchable, well-formed and canonical,
 *   2. checks robots.txt advertises it (that IS how Google finds it now),
 *   3. optionally spot-checks that the URLs in it resolve,
 *   4. routes the actual "we changed" notification through IndexNow.
 *
 *   node seo-pipeline/indexing/ping-sitemap.mjs --help
 *
 * Node 18+ ESM, zero npm dependencies.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import {
  SITE, CANONICAL_HOST, HERE,
  c, log, warn, fail, ok,
  parseArgs, toCanonicalUrl, isoDay, fetchWithTimeout, fetchSitemap,
} from './lib.mjs';

const SITEMAP_URL = process.env.SITEMAP_URL || `${SITE}/sitemap.xml`;
const MAX_URLS = 50_000;          // sitemaps.org limit
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB uncompressed limit

const HELP = `
${c.bold('ping-sitemap.mjs')} — validate the live sitemap and notify the engines that still listen

${c.bold('USAGE')}
  node seo-pipeline/indexing/ping-sitemap.mjs [options]

${c.bold('OPTIONS')}
  --sitemap <url>    sitemap to check (default ${SITEMAP_URL})
  --check-urls [n]   spot-check that n sitemap URLs return HTTP 200 (default 5)
  --indexnow         also run indexnow.mjs --all (still a DRY RUN unless --yes)
  --yes              passed through to indexnow.mjs — actually submits
  --help             this text

${c.bold('EXAMPLES')}
  node seo-pipeline/indexing/ping-sitemap.mjs
  node seo-pipeline/indexing/ping-sitemap.mjs --check-urls 10
  node seo-pipeline/indexing/ping-sitemap.mjs --indexnow            # dry run
  node seo-pipeline/indexing/ping-sitemap.mjs --indexnow --yes      # real submit
`;

/** Endpoints people still copy-paste from old blog posts. We name them, we do not call them. */
const DEPRECATED = [
  {
    name: 'Google sitemap ping',
    endpoint: 'https://www.google.com/ping?sitemap=<url>',
    status: 'DEPRECATED (retired June 2023, now 404)',
    instead: 'robots.txt Sitemap: line + Search Console → Sitemaps. Per-URL: URL Inspection → Request Indexing.',
  },
  {
    name: 'Bing sitemap ping',
    endpoint: 'https://www.bing.com/ping?sitemap=<url>',
    status: 'DEPRECATED (retired, Bing points to IndexNow)',
    instead: 'IndexNow (indexnow.mjs) + Bing Webmaster Tools → Sitemaps.',
  },
  {
    name: 'Yandex sitemap ping',
    endpoint: 'https://webmaster.yandex.com/ping?sitemap=<url>',
    status: 'DEPRECATED / account-scoped',
    instead: 'IndexNow (Yandex is an IndexNow participant) + Yandex Webmaster.',
  },
];

async function head(url) {
  try {
    // Some hosts (and Vercel SPA rewrites) behave oddly on HEAD — use a ranged GET.
    const res = await fetchWithTimeout(url, { headers: { range: 'bytes=0-2048', 'user-agent': 'anandrochlani-indexing/1.0' } }, 15_000);
    return { status: res.status, contentType: res.headers.get('content-type') || '' };
  } catch (e) {
    return { status: 0, contentType: '', error: e.message };
  }
}

function runIndexNow(passYes) {
  return new Promise((resolve) => {
    const args = [path.join(HERE, 'indexnow.mjs'), '--all'];
    if (passYes) args.push('--yes');
    log('');
    log(c.bold(`> node ${['seo-pipeline/indexing/indexnow.mjs', ...args.slice(1)].join(' ')}`));
    const child = spawn(process.execPath, args, { stdio: 'inherit' });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2), ['sitemap', 'check-urls']);
  if (args.help || args.h) { log(HELP); return 0; }

  const sitemapUrl = typeof args.sitemap === 'string' ? args.sitemap : SITEMAP_URL;
  let problems = 0;
  let warnings = 0;

  log(c.bold(`\nSitemap check · ${sitemapUrl}\n`));

  /* --- 1. fetch + parse ------------------------------------------ */
  let sm;
  try {
    sm = await fetchSitemap(sitemapUrl);
  } catch (e) {
    fail(e.message);
    log('  The sitemap must be live before any notification is worth sending.');
    log('  Regenerate with: node seo-pipeline/generate-sitemap.mjs, then commit + deploy.');
    return 1;
  }
  ok(`HTTP ${sm.status} · ${Buffer.byteLength(sm.xml)} bytes · content-type: ${sm.contentType || '(none)'}`);

  if (!/xml/i.test(sm.contentType)) {
    warn(`content-type is "${sm.contentType}" — search engines prefer application/xml or text/xml.`);
    warnings++;
  }
  if (/^\s*<!doctype html/i.test(sm.xml)) {
    fail('The server returned an HTML page, not XML — the SPA catch-all rewrite is swallowing /sitemap.xml.');
    return 1;
  }
  for (const w of sm.warnings) { warn(w); warnings++; }

  /* --- 2. structural validation ---------------------------------- */
  const total = sm.entries.length;
  if (!total) { fail('Sitemap contains zero <url> entries.'); return 1; }
  ok(`${total} <url> entries parsed`);
  if (total > MAX_URLS) { fail(`${total} URLs exceeds the ${MAX_URLS} per-sitemap limit — split into a sitemap index.`); problems++; }
  if (Buffer.byteLength(sm.xml) > MAX_BYTES) { fail('Sitemap exceeds the 50 MB uncompressed limit.'); problems++; }

  const wwwUrls = sm.entries.filter((e) => /:\/\/www\./i.test(e.rawLoc));
  const offHost = sm.entries.filter((e) => !e.loc);
  const dupes = new Set();
  const seen = new Set();
  for (const e of sm.entries) {
    if (!e.loc) continue;
    if (seen.has(e.loc)) dupes.add(e.loc);
    seen.add(e.loc);
  }
  const badLastmod = sm.entries.filter((e) => e.lastmod && !isoDay(e.lastmod));
  const noLastmod = sm.entries.filter((e) => !e.lastmod);

  if (wwwUrls.length) {
    fail(`${wwwUrls.length}/${total} <loc> use the www host (e.g. ${wwwUrls[0].rawLoc}).`);
    log(`  www.${CANONICAL_HOST} has a BROKEN TLS certificate — crawlers hitting those URLs get a cert error.`);
    log(`  Canonical host is the apex ${CANONICAL_HOST}. Fix seo-pipeline/generate-sitemap.mjs, regenerate, redeploy.`);
    problems++;
  } else {
    ok(`All <loc> values are on the canonical apex host ${CANONICAL_HOST}`);
  }
  if (offHost.length) { warn(`${offHost.length} <loc> point at a different site and would be rejected by IndexNow (422).`); warnings++; }
  if (dupes.size) { warn(`${dupes.size} duplicate URL(s), e.g. ${[...dupes][0]}`); warnings++; }
  if (badLastmod.length) { warn(`${badLastmod.length} unparseable <lastmod> value(s), e.g. "${badLastmod[0].lastmod}" — use YYYY-MM-DD or full ISO 8601.`); warnings++; }
  if (noLastmod.length) { warn(`${noLastmod.length} entries have no <lastmod> — indexnow.mjs --new cannot tell whether they are fresh.`); warnings++; }

  /* --- 3. robots.txt --------------------------------------------- */
  log('');
  log(c.bold('robots.txt (this is how Google actually discovers your sitemap)'));
  try {
    const res = await fetchWithTimeout(`${SITE}/robots.txt`, { headers: { 'user-agent': 'anandrochlani-indexing/1.0' } }, 15_000);
    const txt = await res.text();
    if (!res.ok) { fail(`robots.txt returned HTTP ${res.status}`); problems++; }
    else {
      const lines = txt.split('\n').map((l) => l.trim()).filter((l) => /^sitemap:/i.test(l));
      if (!lines.length) { fail('robots.txt has no "Sitemap:" line — add one.'); problems++; }
      else {
        for (const l of lines) {
          const declared = l.replace(/^sitemap:\s*/i, '').trim();
          const canon = toCanonicalUrl(declared);
          if (/:\/\/www\./i.test(declared)) {
            fail(`robots.txt advertises the www host: ${declared} (broken TLS). Use ${canon || `${SITE}/sitemap.xml`}.`);
            problems++;
          } else if (canon === toCanonicalUrl(sitemapUrl)) {
            ok(`robots.txt advertises ${declared}`);
          } else {
            warn(`robots.txt advertises ${declared}, which is not the sitemap just checked.`);
            warnings++;
          }
        }
      }
      if (/^\s*Disallow:\s*\/\s*$/mi.test(txt)) { fail('robots.txt contains a site-wide "Disallow: /" — nothing will be indexed.'); problems++; }
    }
  } catch (e) {
    fail(`robots.txt fetch failed: ${e.message}`);
    problems++;
  }

  /* --- 4. optional url spot-check --------------------------------- */
  if (args['check-urls']) {
    const n = Number(args['check-urls'] === true ? 5 : args['check-urls']) || 5;
    const sample = sm.entries.filter((e) => e.loc).slice(0, n);
    log('');
    log(c.bold(`Spot-checking ${sample.length} URL(s)`));
    for (const e of sample) {
      const r = await head(e.loc);
      const good = r.status >= 200 && r.status < 400;
      const line = `HTTP ${r.status || 'ERR'}  ${e.loc}${r.error ? ` (${r.error})` : ''}`;
      if (good) ok(line); else { fail(line); problems++; }
    }
    log(c.dim('  Note: this is a React SPA — every path returns 200 with the same shell. A 200 here does'));
    log(c.dim('  NOT prove the route renders real content. Verify a few in a browser / GSC URL Inspection.'));
  }

  /* --- 5. what to do about notification --------------------------- */
  log('');
  log(c.bold('Sitemap "ping" endpoints'));
  for (const d of DEPRECATED) {
    log(`  ${c.yellow('SKIPPED')} ${d.name}`);
    log(`          ${c.dim(d.endpoint)}`);
    log(`          ${c.dim(`status : ${d.status}`)}`);
    log(`          ${c.dim(`instead: ${d.instead}`)}`);
  }
  log(`  ${c.green('LIVE')}    IndexNow — https://api.indexnow.org/indexnow`);
  log(`          ${c.dim('Bing, Yandex, Naver, Seznam. This is the only push notification that still works.')}`);
  log(`          ${c.dim('Google is not an IndexNow participant: use Search Console (see gsc-setup.md).')}`);

  log('');
  log(c.bold('So, after a deploy that changed content:'));
  log('  1. node seo-pipeline/generate-sitemap.mjs   (regenerate)   → commit + push → Vercel deploy');
  log('  2. node seo-pipeline/indexing/ping-sitemap.mjs             (this check)');
  log('  3. node seo-pipeline/indexing/indexnow.mjs --new           (dry run) then --new --yes');
  log('  4. Google: Search Console → Sitemaps (resubmit) + URL Inspection → Request Indexing');
  log(c.dim('     Search Console is a one-time setup — see seo-pipeline/indexing/gsc-setup.md'));

  /* --- 6. optionally chain into indexnow --------------------------- */
  let inCode = 0;
  if (args.indexnow) inCode = await runIndexNow(args.yes === true);
  else if (args.yes) warn('--yes only has an effect together with --indexnow. Nothing was submitted.');

  log('');
  if (problems) fail(`${problems} problem(s), ${warnings} warning(s). Fix the problems before relying on indexing.`);
  else if (warnings) log(c.yellow(`Sitemap OK with ${warnings} warning(s).`));
  else ok('Sitemap is healthy.');

  return problems || inCode ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => { fail(e.stack || e.message); process.exit(1); });
