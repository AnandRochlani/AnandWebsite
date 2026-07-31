#!/usr/bin/env node
/**
 * Backlink health monitor.
 *
 *   node seo-pipeline/backlinks/monitor.mjs --help
 *
 * Fetches every page that is supposed to link to anandrochlani.com, confirms the
 * <a href> is still there, and records its anchor text and rel attribute. Flags
 * removals, 404s, redirects, noindexed linking pages, and links that quietly
 * turned into nofollow/ugc/sponsored.
 *
 * Read-only. One request at a time by default, with a delay between them and a
 * descriptive User-Agent. It is a link checker, not a crawler — keep it that way.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MONITOR_REPORT,
  REPO_ROOT,
  SITE,
  USER_AGENT,
  c,
  findLinksTo,
  fmtDate,
  hasNoindex,
  httpGet,
  loadPipeline,
  nowISO,
  num,
  parseArgs,
  readJson,
  sleep,
  slug,
  table,
  truncate,
  writeJson,
} from './lib.mjs';

const rel = (p) => path.relative(REPO_ROOT, p);

const HELP = `
${c.bold('monitor.mjs')} — verify earned backlinks are still live and still followed

${c.bold('Usage')}
  node seo-pipeline/backlinks/monitor.mjs [options]

${c.bold('What it checks, per linking page')}
  • the page still loads (status, redirects)
  • an <a href> to ${SITE.host} is still present
  • the anchor text (recorded, and diffed against last run)
  • the rel attribute — flags a followed link that became nofollow / ugc / sponsored
  • the linking page is not meta-noindex (a noindexed page passes nothing)
  • the link does not point at ${c.red(SITE.badHost)} (broken TLS cert — always a defect)

${c.bold('Options')}
  --limit <n>        check at most n links (default: all)
  --delay <ms>       pause between requests (default 2000, min 250)
  --concurrency <n>  parallel fetches (default 1, max 3 — be polite)
  --timeout <ms>     per-request timeout (default 20000)
  --url <u>          check an ad-hoc URL instead of the pipeline (repeatable)
  --state <s>        pipeline state to monitor (default: won)
  --out <file>       report path (default ${rel(MONITOR_REPORT)})
  --no-write         do not write the report file
  --json             print the report as JSON
  --strict           exit 1 if anything is broken (default: exit 1 only on NEW breakage)

${c.bold('Examples')}
  node seo-pipeline/backlinks/monitor.mjs --limit 1
  node seo-pipeline/backlinks/monitor.mjs --delay 3000
  node seo-pipeline/backlinks/monitor.mjs --url https://example.com/resources --no-write

${c.dim(`User-Agent: ${USER_AGENT}`)}
`;

/* --------------------------------------------------------------- checking */

const SEVERITY = { ok: 0, warn: 1, broken: 2 };

function classify(target, res) {
  const issues = [];
  const out = {
    id: target.id,
    name: target.name || target.id,
    pageUrl: target.url,
    finalUrl: res.url,
    status: res.status,
    checkedAt: nowISO(),
    linkFound: false,
    links: [],
    anchor: null,
    rel: null,
    follow: null,
    issues,
    result: 'ok',
    severity: 'ok',
  };

  if (res.error) {
    issues.push({ code: 'fetch-error', detail: res.error });
    out.result = 'unreachable';
    out.severity = 'broken';
    return out;
  }
  if (!res.ok) {
    issues.push({ code: 'http-error', detail: `HTTP ${res.status}` });
    out.result = res.status === 404 ? 'page-gone' : 'http-error';
    out.severity = 'broken';
    return out;
  }
  if (res.url && stripTrailing(res.url) !== stripTrailing(target.url)) {
    issues.push({ code: 'redirected', detail: `${target.url} → ${res.url}` });
  }
  if (hasNoindex(res.body)) {
    issues.push({ code: 'page-noindex', detail: 'linking page is meta noindex — passes no value' });
  }

  const links = findLinksTo(res.body, SITE.host, res.url || target.url);
  out.links = links.map((l) => ({
    href: l.absolute,
    anchor: l.anchor,
    rel: l.rel,
    follow: l.follow,
  }));

  if (!links.length) {
    issues.push({ code: 'link-missing', detail: `no <a> to ${SITE.host} found on the page` });
    out.result = 'link-removed';
    out.severity = 'broken';
    return out;
  }

  // Prefer the link that points at the page we actually asked for, if known.
  const preferred =
    (target.targetPath && links.find((l) => new URL(l.absolute).pathname === target.targetPath)) ||
    links.find((l) => l.follow) ||
    links[0];

  out.linkFound = true;
  out.anchor = preferred.anchor || null;
  out.rel = preferred.rel;
  out.follow = preferred.follow;

  if (!preferred.anchor) issues.push({ code: 'empty-anchor', detail: 'link has no visible anchor text' });
  if (!preferred.follow)
    issues.push({
      code: 'nofollow',
      detail: `rel="${preferred.rel}" — link does not pass authority`,
    });
  for (const l of links) {
    if (l.hostname === SITE.badHost)
      issues.push({
        code: 'www-host',
        detail: `link points at ${SITE.badHost} which has a BROKEN TLS cert — ask for the apex URL`,
      });
  }
  if (target.targetPath && !links.some((l) => new URL(l.absolute).pathname === target.targetPath))
    issues.push({
      code: 'target-drift',
      detail: `expected a link to ${target.targetPath}; found ${links.map((l) => new URL(l.absolute).pathname).join(', ')}`,
    });

  if (issues.some((i) => ['nofollow', 'page-noindex', 'www-host'].includes(i.code))) {
    out.result = 'degraded';
    out.severity = 'warn';
  } else if (issues.length) {
    out.result = 'ok-with-notes';
    out.severity = 'warn';
  }
  return out;
}

const stripTrailing = (u) => String(u || '').replace(/\/$/, '');

/* ------------------------------------------------------------------- diff */

function diff(prev, curr) {
  const prevById = new Map((prev?.results || []).map((r) => [r.id, r]));
  const changes = [];
  for (const r of curr.results) {
    const p = prevById.get(r.id);
    if (!p) {
      changes.push({ id: r.id, kind: 'new', detail: `first check → ${r.result}` });
      continue;
    }
    if (p.result !== r.result) {
      const worse = SEVERITY[r.severity] > SEVERITY[p.severity];
      changes.push({
        id: r.id,
        kind: worse ? 'regressed' : 'improved',
        detail: `${p.result} → ${r.result}`,
      });
    }
    if (p.linkFound && r.linkFound) {
      if (p.follow === true && r.follow === false)
        changes.push({
          id: r.id,
          kind: 'regressed',
          detail: `link went nofollow (rel="${r.rel}") — it was followed on ${fmtDate(p.checkedAt)}`,
        });
      if (p.follow === false && r.follow === true)
        changes.push({ id: r.id, kind: 'improved', detail: 'link is followed again' });
      if ((p.anchor || '') !== (r.anchor || ''))
        changes.push({
          id: r.id,
          kind: 'changed',
          detail: `anchor "${truncate(p.anchor, 40)}" → "${truncate(r.anchor, 40)}"`,
        });
    }
    if (p.status !== r.status)
      changes.push({ id: r.id, kind: p.status === 200 ? 'regressed' : 'changed', detail: `HTTP ${p.status} → ${r.status}` });
  }
  for (const p of prevById.values())
    if (!curr.results.some((r) => r.id === p.id))
      changes.push({ id: p.id, kind: 'dropped', detail: 'no longer in the monitored set' });
  return changes;
}

/* ------------------------------------------------------------------- main */

async function main(argv) {
  const { flags } = parseArgs(argv, { booleans: ['no-write', 'strict'] });
  if (flags.help) {
    console.log(HELP);
    return 0;
  }

  const adHoc = argv.filter((a, i) => argv[i - 1] === '--url' || a.startsWith('--url='))
    .map((s) => (s.startsWith('--url=') ? s.slice(6) : s));

  let targets;
  if (adHoc.length) {
    // Stable, URL-derived ids so the run-to-run diff stays meaningful.
    targets = adHoc.map((u, i) => ({
      id: slug(u.replace(/^https?:\/\//, '')) || `adhoc-${i + 1}`,
      name: u,
      url: u,
      targetPath: null,
    }));
  } else {
    const pipeline = loadPipeline();
    const state = flags.state || 'won';
    const won = pipeline.entries.filter((e) => e.state === state);
    targets = won
      .filter((e) => e.linkUrl)
      .map((e) => ({ id: e.id, name: e.name, url: e.linkUrl, targetPath: e.targetPath }));
    const noUrl = won.length - targets.length;
    if (noUrl > 0)
      console.log(
        c.yellow(
          `! ${noUrl} '${state}' entr(ies) have no linkUrl and cannot be monitored — set one with:\n  outreach.mjs move <id> won --link-url <the page that links to us> --force`
        )
      );
  }

  const limit = num(flags.limit, targets.length);
  targets = targets.slice(0, limit);

  if (!targets.length) {
    console.log('Nothing to monitor.');
    console.log(
      c.dim(
        'Win a link first, then: outreach.mjs move <id> won --link-url https://their.site/page\n' +
          'Or check any page ad hoc:  monitor.mjs --url https://their.site/page --no-write'
      )
    );
    return 0;
  }

  const delay = Math.max(250, num(flags.delay, 2000));
  const concurrency = Math.min(3, Math.max(1, num(flags.concurrency, 1)));
  const timeoutMs = num(flags.timeout, 20000);

  console.log(
    c.dim(
      `Checking ${targets.length} link(s) — concurrency ${concurrency}, ${delay}ms between requests, ${timeoutMs}ms timeout`
    )
  );

  const results = [];
  const queue = [...targets];
  const worker = async () => {
    while (queue.length) {
      const t = queue.shift();
      const res = await httpGet(t.url, { timeoutMs });
      const r = classify(t, res);
      results.push(r);
      const mark =
        r.severity === 'broken' ? c.red('BROKEN') : r.severity === 'warn' ? c.yellow(' WARN ') : c.green('  OK  ');
      console.log(`  ${mark} ${truncate(t.url, 78)}`);
      if (queue.length) await sleep(delay);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  results.sort((a, b) => a.id.localeCompare(b.id));

  const outPath = flags.out ? path.resolve(flags.out) : MONITOR_REPORT;
  const previous = readJson(outPath);
  const report = {
    generatedAt: nowISO(),
    site: SITE.canonical,
    userAgent: USER_AGENT,
    checked: results.length,
    summary: {
      ok: results.filter((r) => r.severity === 'ok').length,
      warn: results.filter((r) => r.severity === 'warn').length,
      broken: results.filter((r) => r.severity === 'broken').length,
      followed: results.filter((r) => r.follow === true).length,
      nofollowed: results.filter((r) => r.follow === false).length,
    },
    results,
  };
  report.changes = diff(previous, report);
  report.previousRun = previous?.generatedAt || null;

  if (flags.json) console.log(JSON.stringify(report, null, 2));
  else printReport(report, previous);

  if (!flags['no-write']) {
    writeJson(outPath, report);
    console.log(c.dim(`\nreport → ${rel(outPath)}`));
  }

  const regressions = report.changes.filter((ch) => ch.kind === 'regressed');
  const broken = report.summary.broken;
  if (flags.strict && (broken || regressions.length)) return 1;
  return regressions.length ? 1 : 0;
}

function printReport(report, previous) {
  console.log(`\n${c.bold('Results')}`);
  table(
    report.results.map((r) => [
      r.id,
      r.severity === 'broken' ? c.red(r.result) : r.severity === 'warn' ? c.yellow(r.result) : c.green(r.result),
      r.status || '—',
      r.follow === null ? '—' : r.follow ? 'follow' : `nofollow(${r.rel})`,
      truncate(r.anchor || '—', 34),
    ]),
    ['ID', 'RESULT', 'HTTP', 'REL', 'ANCHOR']
  );

  const withIssues = report.results.filter((r) => r.issues.length);
  if (withIssues.length) {
    console.log(`\n${c.bold('Issues')}`);
    for (const r of withIssues) {
      console.log(`  ${c.bold(r.id)}  ${c.dim(r.pageUrl)}`);
      for (const i of r.issues) {
        const paint = ['link-missing', 'http-error', 'fetch-error'].includes(i.code) ? c.red : c.yellow;
        console.log(`    ${paint(i.code)}: ${i.detail}`);
      }
    }
  }

  console.log(`\n${c.bold('Diff')} ${c.dim(previous ? `vs ${fmtDate(previous.generatedAt)}` : '(no previous run)')}`);
  if (!report.changes.length) console.log(c.dim('  no change since last run'));
  else
    for (const ch of report.changes) {
      const paint =
        ch.kind === 'regressed' ? c.red : ch.kind === 'improved' ? c.green : ch.kind === 'new' ? c.cyan : c.yellow;
      console.log(`  ${paint(ch.kind.padEnd(9))} ${ch.id}  ${ch.detail}`);
    }

  const s = report.summary;
  console.log(
    `\n${c.bold('Summary')}  ${c.green(`${s.ok} ok`)}  ${c.yellow(`${s.warn} warn`)}  ${c.red(
      `${s.broken} broken`
    )}   ${c.dim(`(${s.followed} followed, ${s.nofollowed} nofollowed)`)}`
  );
  if (s.broken)
    console.log(
      c.dim(
        '\nA removed link is worth one polite email, once. If they took it down on purpose, let it go —\nchasing a removal is how a link builder turns into a nuisance.'
      )
    );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (e) {
    console.error(c.red(`error: ${e.message}`));
    process.exitCode = 1;
  }
}
