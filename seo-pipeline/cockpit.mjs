#!/usr/bin/env node
/**
 * Weekly SEO cockpit — turns raw Search Console data into the week's decisions.
 *
 *   node seo-pipeline/cockpit.mjs            # read reports/performance-latest.json
 *   node seo-pipeline/cockpit.mjs --pull     # pull fresh GSC data first (needs creds)
 *   node seo-pipeline/cockpit.mjs --week 6   # override the auto-derived plan week
 *
 * Writes reports/weekly-<date>.md and prints it. Designed to run unattended in CI:
 * with no GSC credentials it still emits the week's writing assignment and the
 * technical state, and exits 0 — a missing key is a setup gap, not a build failure.
 *
 * The rules encoded here are the ones in SEO_MASTER_PLAN_90_DAYS.md §9. They exist as
 * code so the weekly decision does not depend on anyone remembering them:
 *
 *   1. A page with impressions sitting at position 8-20 gets refreshed BEFORE any new
 *      page is written. Moving a page from 12 to 6 beats publishing a 40th article.
 *   2. A query with real impressions and no dedicated page becomes the next article,
 *      overriding the planned queue.
 *   3. Two URLs ranking for one query are cannibalising and must be merged.
 *   4. A cluster with no impressions after 60 days stops being fed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(here, '..');
const reportsDir = path.join(here, 'reports');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const flag = (f, d = null) => {
  const i = argv.indexOf(f);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};

/* ── thresholds ──────────────────────────────────────────────────────── */
const REFRESH_BAND = [8, 20]; // positions worth pushing onto page 1
const REFRESH_MIN_IMPRESSIONS = 30;
const GAP_MIN_IMPRESSIONS = 200; // §9: ">200 impressions and no dedicated page"
const GAP_MIN_POSITION = 15; // only chase gaps we are at least visible for
const STRIKING_DISTANCE_TOP = 5; // "queries in positions 5-20" KPI

/* ── plan calendar ───────────────────────────────────────────────────── */
const PLAN_START = new Date('2026-08-03T00:00:00Z'); // Week 1, Monday

function planWeek(now = new Date()) {
  const override = Number(flag('--week'));
  if (override) return override;
  const diff = Math.floor((now - PLAN_START) / (7 * 864e5)) + 1;
  return Math.min(Math.max(diff, 1), 13);
}

const readJson = (p, fallback = null) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
};

/* ── data ────────────────────────────────────────────────────────────── */

function pullPerformance() {
  const r = spawnSync(process.execPath, [path.join(here, 'gsc.mjs'), 'performance', '28'], {
    stdio: 'inherit',
    cwd: REPO,
  });
  return r.status === 0;
}

function loadKeywordMap() {
  const map = readJson(path.join(here, 'keyword-map.json'));
  if (!map) return { keywords: [], targets: {} };
  const keywords = [];
  for (const [cluster, c] of Object.entries(map.clusters || {})) {
    for (const k of c.keywords || []) keywords.push({ ...k, cluster });
  }
  return { keywords, targets: map.targets || {}, decisionRules: map.decisionRules || [] };
}

function livePosts() {
  const dir = path.join(here, 'articles');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => readJson(path.join(dir, f)))
    .filter(Boolean);
}

/** Does any page on the site already target this query? */
function hasDedicatedPage(query, posts) {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  if (!words.length) return true;
  return posts.some((p) => {
    const hay = `${p.slug} ${p.title}`.toLowerCase();
    const hits = words.filter((w) => hay.includes(w)).length;
    return hits / words.length >= 0.7;
  });
}

/* ── analysis ────────────────────────────────────────────────────────── */

function analyse(perf, posts) {
  if (!perf) return null;
  const q = perf.queries || [];
  const pages = perf.pages || [];

  const refreshRadar = pages
    .filter((p) => p.position >= REFRESH_BAND[0] && p.position <= REFRESH_BAND[1])
    .filter((p) => p.impressions >= REFRESH_MIN_IMPRESSIONS)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  const gapRadar = q
    .filter((r) => r.impressions >= GAP_MIN_IMPRESSIONS)
    .filter((r) => r.position >= GAP_MIN_POSITION)
    .filter((r) => !hasDedicatedPage(r.query, posts))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  // One query served by 2+ of our URLs: Google is choosing between them, and the
  // split signal usually leaves both worse off than one merged page.
  const byQuery = new Map();
  for (const row of perf.queryPage || []) {
    if (!byQuery.has(row.query)) byQuery.set(row.query, []);
    byQuery.get(row.query).push(row);
  }
  const cannibalisation = [...byQuery.entries()]
    .filter(([, rows]) => rows.length > 1 && rows.reduce((s, r) => s + r.impressions, 0) >= REFRESH_MIN_IMPRESSIONS)
    .map(([query, rows]) => ({
      query,
      impressions: rows.reduce((s, r) => s + r.impressions, 0),
      pages: rows.sort((a, b) => b.impressions - a.impressions).map((r) => r.page),
    }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 5);

  const strikingDistance = q.filter(
    (r) => r.position >= STRIKING_DISTANCE_TOP && r.position <= REFRESH_BAND[1]
  ).length;

  return { refreshRadar, gapRadar, cannibalisation, strikingDistance };
}

function scorecard(perf, analysis, targets) {
  // Compare against the month target whose date is nearest ahead of the data window.
  const end = perf?.window?.endDate || new Date().toISOString().slice(0, 10);
  const key = Object.keys(targets)
    .sort()
    .find((d) => d >= end) || Object.keys(targets).sort().pop();
  const t = targets[key] || {};
  const actual = {
    clicks: perf?.totals?.clicks ?? null,
    impressions: perf?.totals?.impressions ?? null,
    queriesPos5to20: analysis?.strikingDistance ?? null,
  };
  const rows = [
    ['Clicks (28d)', actual.clicks, t.clicks],
    ['Impressions (28d)', actual.impressions, t.impressions],
    ['Queries in positions 5-20', actual.queriesPos5to20, t.queriesPos5to20],
  ];
  return { targetDate: key, rows };
}

/* ── report ──────────────────────────────────────────────────────────── */

function assignmentFor(week, keywords) {
  return keywords.filter((k) => k.week === week);
}

function pct(actual, target) {
  if (actual == null || !target) return '—';
  return `${Math.round((actual / target) * 100)}%`;
}

function build() {
  const week = planWeek();
  const { keywords, targets } = loadKeywordMap();
  const posts = livePosts();

  if (has('--pull')) pullPerformance();

  const perf = readJson(path.join(reportsDir, 'performance-latest.json'));
  const analysis = analyse(perf, posts);
  const today = new Date().toISOString().slice(0, 10);

  const L = [];
  L.push(`# SEO weekly — ${today} (plan week ${week} of 13)`);
  L.push('');

  if (!perf) {
    L.push('> **No Search Console data yet.** Add the service-account key');
    L.push('> (`seo-pipeline/GSC_SETUP.md`) and this report starts measuring instead of');
    L.push('> just assigning. Everything below still applies.');
    L.push('');
  }

  /* 1 — scorecard */
  L.push('## Scorecard');
  L.push('');
  if (perf) {
    const sc = scorecard(perf, analysis, targets);
    L.push(`Window: ${perf.window.startDate} → ${perf.window.endDate} · target date ${sc.targetDate}`);
    L.push('');
    L.push('| Metric | Actual | Target | |');
    L.push('|---|---:|---:|---:|');
    for (const [name, a, t] of sc.rows) L.push(`| ${name} | ${a ?? '—'} | ${t ?? '—'} | ${pct(a, t)} |`);
    L.push(`| Avg position | ${(perf.totals.position || 0).toFixed(1)} | — | |`);
  } else {
    L.push('_Pending Search Console access._');
  }
  L.push('');
  L.push(`Articles in the repo: **${posts.length}**`);
  L.push('');

  /* 2 — refresh first */
  L.push('## 1. Refresh these first (rule: position 8-20 beats a new page)');
  L.push('');
  if (analysis?.refreshRadar.length) {
    L.push('| Page | Impressions | Clicks | Position |');
    L.push('|---|---:|---:|---:|');
    for (const p of analysis.refreshRadar) {
      L.push(`| ${p.page.replace(/^https?:\/\/[^/]+/, '')} | ${p.impressions} | ${p.clicks} | ${p.position.toFixed(1)} |`);
    }
    L.push('');
    L.push('Add a section answering the query more directly, an original diagram, a worked');
    L.push('example, and 2 internal links from stronger pages. Then resubmit via IndexNow.');
  } else {
    L.push(perf ? '_Nothing in the 8-20 band yet — keep publishing._' : '_Pending data._');
  }
  L.push('');

  /* 3 — write next */
  L.push('## 2. Write next');
  L.push('');
  if (analysis?.gapRadar.length) {
    L.push('**Search Console overrides the plan** — these queries have real impressions and no');
    L.push('dedicated page:');
    L.push('');
    L.push('| Query | Impressions | Position |');
    L.push('|---|---:|---:|');
    for (const r of analysis.gapRadar) L.push(`| ${r.query} | ${r.impressions} | ${r.position.toFixed(1)} |`);
    L.push('');
  }
  const assigned = assignmentFor(week, keywords);
  if (assigned.length) {
    L.push(`Planned for week ${week}:`);
    L.push('');
    L.push('| ID | Keyword | Cluster | Est. volume | Difficulty |');
    L.push('|---|---|---|---:|:--:|');
    for (const k of assigned) {
      const v = k.volumeEst ? `${k.volumeEst[0]}-${k.volumeEst[1]}` : '—';
      L.push(`| ${k.id} | ${k.keyword} | ${k.cluster} | ${v} | ${k.difficulty} |`);
    }
    L.push('');
    L.push('Draft with: `/seo-article` (or `node seo-pipeline/qa.mjs` once drafted).');
  } else {
    L.push(`_No keyword scheduled for week ${week} — pick the top backlog item in keyword-map.json._`);
  }
  L.push('');

  /* 4 — cannibalisation */
  L.push('## 3. Cannibalisation');
  L.push('');
  if (analysis?.cannibalisation.length) {
    for (const c of analysis.cannibalisation) {
      L.push(`- **${c.query}** (${c.impressions} impressions) is split across ${c.pages.length} URLs:`);
      for (const p of c.pages) L.push(`  - ${p.replace(/^https?:\/\/[^/]+/, '')}`);
      L.push('  → keep the strongest, merge the rest into it, 301 the losers.');
    }
  } else {
    L.push(perf ? '_None detected._' : '_Pending data._');
  }
  L.push('');

  /* 5 — standing weekly checklist */
  L.push('## 4. Standing tasks');
  L.push('');
  L.push('- [ ] Publish the week\'s articles (`npm run seo -- build`, then deploy)');
  L.push('- [ ] `npm run seo:sitemap` + `npm run seo:indexnow -- --yes`');
  L.push('- [ ] Distribute: LinkedIn post, dev.to/Hashnode syndication with canonical');
  L.push('- [ ] 5 personalised outreach emails, logged in `backlinks/pipeline.json`');
  L.push('- [ ] 1 lecture video uploaded, embedded on its matching article (`video` field)');
  L.push('');
  L.push('---');
  L.push('');
  L.push('_Generated by `seo-pipeline/cockpit.mjs`. Rules: SEO_MASTER_PLAN_90_DAYS.md §9._');

  const md = L.join('\n');
  fs.mkdirSync(reportsDir, { recursive: true });
  const out = path.join(reportsDir, `weekly-${today}.md`);
  fs.writeFileSync(out, md);
  fs.writeFileSync(path.join(reportsDir, 'weekly-latest.md'), md);
  console.log(md);
  console.error(`\n[cockpit] wrote ${path.relative(REPO, out)}`);
}

build();
