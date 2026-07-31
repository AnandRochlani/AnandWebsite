#!/usr/bin/env node
/**
 * Google Search Console automation — the legit indexing path.
 *
 *   node seo-pipeline/gsc.mjs status                 # sitemaps Google knows about + errors
 *   node seo-pipeline/gsc.mjs submit                 # (re)submit https://anandrochlani.com/sitemap.xml
 *   node seo-pipeline/gsc.mjs inspect                # inspect every live blog/course URL, write report
 *   node seo-pipeline/gsc.mjs inspect <url> [...]    # inspect specific URLs
 *
 * Auth: a Google Cloud service account with the Search Console API enabled, added as a
 * user (Full permission) on the GSC property. See GSC_SETUP.md (one-time, ~10 min).
 *
 * Env:
 *   GSC_CREDENTIALS  path to service-account JSON key
 *                    (default seo-pipeline/.gsc-service-account.json — gitignored)
 *   GSC_PROPERTY     GSC property id (default "sc-domain:anandrochlani.com";
 *                    use "https://anandrochlani.com/" if you verified a URL-prefix property)
 *
 * No dependencies: signs the service-account JWT with node:crypto.
 * Note: this deliberately does NOT use the Google Indexing API — that API is restricted
 * to JobPosting/BroadcastEvent pages; using it for blog content violates its terms.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = 'https://anandrochlani.com';
const PROPERTY = process.env.GSC_PROPERTY || 'sc-domain:anandrochlani.com';
const CRED_PATH = process.env.GSC_CREDENTIALS || path.join(here, '.gsc-service-account.json');
const SITEMAP_URL = `${SITE}/sitemap.xml`;
const SCOPE = 'https://www.googleapis.com/auth/webmasters';

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

async function getAccessToken() {
  if (!fs.existsSync(CRED_PATH)) {
    console.error(`Service-account key not found at ${CRED_PATH}.`);
    console.error('Follow seo-pipeline/GSC_SETUP.md, or set GSC_CREDENTIALS to the key path.');
    process.exit(1);
  }
  const key = JSON.parse(fs.readFileSync(CRED_PATH, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: key.client_email,
      scope: SCOPE,
      aud: key.token_uri,
      iat: now,
      exp: now + 3600,
    })
  );
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(key.private_key).toString('base64url');
  const assertion = `${header}.${claims}.${signature}`;

  const res = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    console.error('Token exchange failed:', JSON.stringify(json));
    process.exit(1);
  }
  return json.access_token;
}

async function gapi(token, url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    /* empty/non-JSON body */
  }
  return { res, json };
}

const sitemapsBase = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(PROPERTY)}/sitemaps`;

async function cmdStatus(token) {
  const { res, json } = await gapi(token, sitemapsBase);
  if (!res.ok) {
    console.error(`List sitemaps failed (${res.status}): ${JSON.stringify(json?.error?.message || json)}`);
    if (res.status === 403) console.error('→ Is the service-account email added as a user on the GSC property?');
    process.exit(1);
  }
  const maps = json.sitemap || [];
  if (!maps.length) {
    console.log('No sitemaps submitted for this property yet. Run: node seo-pipeline/gsc.mjs submit');
    return;
  }
  for (const m of maps) {
    console.log(`${m.path}`);
    console.log(`  submitted: ${m.lastSubmitted}  downloaded: ${m.lastDownloaded || 'never'}`);
    console.log(`  pending: ${m.isPending}  errors: ${m.errors}  warnings: ${m.warnings}`);
    for (const c of m.contents || []) console.log(`  type ${c.type}: submitted ${c.submitted}, indexed ${c.indexed ?? 'n/a'}`);
  }
}

async function cmdSubmit(token) {
  const { res, json } = await gapi(token, `${sitemapsBase}/${encodeURIComponent(SITEMAP_URL)}`, { method: 'PUT' });
  if (!res.ok) {
    console.error(`Submit failed (${res.status}): ${JSON.stringify(json?.error?.message || json)}`);
    process.exit(1);
  }
  console.log(`Submitted ${SITEMAP_URL} to property ${PROPERTY}.`);
  console.log('Google fetches it on its own schedule — check back with: node seo-pipeline/gsc.mjs status');
}

async function liveUrls() {
  const [postsRes, coursesRes] = await Promise.all([
    fetch(`${SITE}/api/public/blog-posts`),
    fetch(`${SITE}/api/public/courses`),
  ]);
  const posts = (await postsRes.json()).posts || [];
  const courses = (await coursesRes.json()).courses || [];
  return [
    `${SITE}/`,
    `${SITE}/courses`,
    `${SITE}/blog`,
    ...courses.map((c) => `${SITE}/courses/${c.id}`),
    ...posts.filter((p) => p.slug).map((p) => `${SITE}/blog/${p.slug}`),
  ];
}

async function cmdInspect(token, urls) {
  const targets = urls.length ? urls : await liveUrls();
  console.log(`Inspecting ${targets.length} URLs against property ${PROPERTY}…\n`);
  const rows = [];
  for (const u of targets) {
    const { res, json } = await gapi(token, 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      body: JSON.stringify({ inspectionUrl: u, siteUrl: PROPERTY }),
    });
    if (!res.ok) {
      rows.push({ url: u, verdict: `ERROR ${res.status}`, detail: json?.error?.message || '' });
      continue;
    }
    const r = json.inspectionResult?.indexStatusResult || {};
    rows.push({
      url: u,
      verdict: r.coverageState || r.verdict || 'UNKNOWN',
      lastCrawl: r.lastCrawlTime || null,
      googleCanonical: r.googleCanonical || null,
      userCanonical: r.userCanonical || null,
      robotsTxtState: r.robotsTxtState || null,
    });
    // URL Inspection quota: 600 req/min — a small delay keeps long runs polite.
    await new Promise((r2) => setTimeout(r2, 250));
  }

  const notIndexed = rows.filter((r) => !/submitted and indexed/i.test(r.verdict || ''));
  for (const r of rows) {
    const flag = /submitted and indexed/i.test(r.verdict || '') ? 'ok  ' : 'MISS';
    console.log(`${flag} ${r.verdict.padEnd(45)} ${r.url}`);
    if (r.googleCanonical && r.googleCanonical !== r.url)
      console.log(`     google canonical differs: ${r.googleCanonical}`);
  }
  console.log(`\n${rows.length - notIndexed.length}/${rows.length} indexed. ${notIndexed.length} need attention.`);

  const reportsDir = path.join(here, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const out = path.join(reportsDir, `inspection-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(out, JSON.stringify({ property: PROPERTY, generatedAt: new Date().toISOString(), rows }, null, 2));
  console.log(`Report: ${path.relative(process.cwd(), out)}`);
  if (notIndexed.length) {
    console.log('\nFor not-indexed URLs: fix any canonical/robots issue shown above, keep the sitemap');
    console.log('fresh, and use Search Console UI "Request indexing" for a handful of priority URLs.');
  }
}

/**
 * Search Analytics pull — the data the whole measurement loop runs on.
 *
 * Google reports on a 2-3 day delay, so the window ends 3 days ago rather than today;
 * asking for "up to today" silently returns a partial final day and makes every
 * week-over-week comparison wrong.
 */
async function cmdPerformance(token, args) {
  const days = Number(args.find((a) => /^\d+$/.test(a))) || 28;
  const end = new Date(Date.now() - 3 * 864e5);
  const start = new Date(end.getTime() - (days - 1) * 864e5);
  const iso = (d) => d.toISOString().slice(0, 10);

  const query = async (dimensions) => {
    const { res, json } = await gapi(
      token,
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(PROPERTY)}/searchAnalytics/query`,
      {
        method: 'POST',
        body: JSON.stringify({
          startDate: iso(start),
          endDate: iso(end),
          dimensions,
          rowLimit: 5000,
          dataState: 'final',
        }),
      }
    );
    if (!res.ok) {
      console.error(`Search Analytics [${dimensions.join('+')}] failed (${res.status}): ${json?.error?.message || ''}`);
      if (res.status === 403) console.error('→ Is the service-account email added as a user on the GSC property?');
      process.exit(1);
    }
    return (json.rows || []).map((r) => ({
      keys: r.keys,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }));
  };

  const [totals, queries, pages, queryPage] = await Promise.all([
    query([]),
    query(['query']),
    query(['page']),
    query(['query', 'page']),
  ]);

  const report = {
    property: PROPERTY,
    generatedAt: new Date().toISOString(),
    window: { startDate: iso(start), endDate: iso(end), days },
    totals: totals[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    queries: queries.map((r) => ({ query: r.keys[0], ...r, keys: undefined })),
    pages: pages.map((r) => ({ page: r.keys[0], ...r, keys: undefined })),
    queryPage: queryPage.map((r) => ({ query: r.keys[0], page: r.keys[1], ...r, keys: undefined })),
  };

  const reportsDir = path.join(here, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const dated = path.join(reportsDir, `performance-${iso(end)}.json`);
  const latest = path.join(reportsDir, 'performance-latest.json');
  const body = JSON.stringify(report, null, 2);
  fs.writeFileSync(dated, body);
  fs.writeFileSync(latest, body);

  const t = report.totals;
  console.log(`${iso(start)} → ${iso(end)} (${days}d)`);
  console.log(`  clicks ${t.clicks}  impressions ${t.impressions}  avg position ${(t.position || 0).toFixed(1)}`);
  console.log(`  ${report.queries.length} queries, ${report.pages.length} pages with data`);
  console.log(`Report: ${path.relative(process.cwd(), dated)}`);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!['status', 'submit', 'inspect', 'performance'].includes(cmd)) {
    console.log('Usage: node seo-pipeline/gsc.mjs <status|submit|inspect|performance> [urls... | days]');
    process.exit(1);
  }
  const token = await getAccessToken();
  if (cmd === 'status') await cmdStatus(token);
  if (cmd === 'submit') await cmdSubmit(token);
  if (cmd === 'inspect') await cmdInspect(token, rest);
  if (cmd === 'performance') await cmdPerformance(token, rest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
