#!/usr/bin/env node
/**
 * Internal-linking engine for the System Design Tutorial series.
 *
 *   node seo-pipeline/internal-links.mjs                    # read-only report
 *   node seo-pipeline/internal-links.mjs --verbose          # + before/after snippets & scoring
 *   node seo-pipeline/internal-links.mjs --post <slug>      # scope to one post
 *   node seo-pipeline/internal-links.mjs --apply            # shows the plan, refuses to write
 *   node seo-pipeline/internal-links.mjs --apply --yes      # rewrites seo-pipeline/articles/*.json
 *
 * Read-only by default. `--apply --yes` only ever writes files inside
 * seo-pipeline/articles/ — published posts are analysed but never modified.
 *
 * Zero npm dependencies (Node 18+ / ESM).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadDrafts, loadSnapshot, fetchLive, mergePosts, loadPlan } from './linking/posts.mjs';
import { buildKeywordMap } from './linking/keywords.mjs';
import { buildGraph } from './linking/graph.mjs';
import { findOpportunities, rewriteContent, DEFAULTS } from './linking/opportunities.mjs';
import { buildReport, printReport } from './linking/report.mjs';
import { runFixtures, roundTrip } from './linking/selfcheck.mjs';
import { verifyRewrite, textOnly } from './linking/html.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const PATHS = {
  articles: path.join(here, 'articles'),
  reference: path.join(here, 'reference'),
  plan: path.join(here, 'content-plan.json'),
  linking: path.join(here, 'linking'),
  keywordMap: path.join(here, 'linking', 'keyword-map.json'),
  keywordSeeds: path.join(here, 'linking', 'keyword-seeds.json'),
  reports: path.join(here, 'reports'),
  reportFile: path.join(here, 'reports', 'internal-links.json'),
};

const HELP = `
internal-links.mjs — internal linking engine for anandrochlani.com

USAGE
  node seo-pipeline/internal-links.mjs [options]

MODES
  (default)              Read-only. Prints a report and writes
                         seo-pipeline/reports/internal-links.json. Nothing else is touched.
  --apply                Show the write plan for seo-pipeline/articles/*.json. Refuses to
                         write without --yes.
  --apply --yes          Rewrite the drafts in place and print a diff summary.
  --self-check           Run the HTML-safety fixtures and exit.

OPTIONS
  --post <slug>          Scope the scan to one source post. Existing site-wide links still
                         constrain it, but proposals for other posts do not — run without
                         --post before a bulk apply.
  --max-links <n>        Max internal links per post, existing + proposed (default ${DEFAULTS.maxLinks}).
  --max-per-target <n>   Max links from one post to the same target (default ${DEFAULTS.maxPerTarget}).
  --min-distance <n>     Min plain-text characters between two links (default ${DEFAULTS.minDistance}).
  --min-next-step <n>    Reserve n slots for links up the series (default ${DEFAULTS.minNextStep}).
  --anchor-repeat <n>    Flag anchor text reused n+ times site-wide (default ${DEFAULTS.anchorRepeatThreshold}).
  --fetch-live           Refresh published posts from https://anandrochlani.com/api/public/blog-posts
                         instead of relying only on reference/live_posts_*.json.
  --articles-dir <path>  Override the drafts directory (testing).
  --no-keyword-map       Do not rewrite linking/keyword-map.json.
  --verbose              Print scoring rationale and before/after HTML snippets.
  --json                 Print the raw JSON report to stdout instead of the human report.
  --help                 This text.

NOTES
  * Published posts are read-only here: proposals for them are reported so you can apply
    them with PUT /api/admin/blog-posts?id=<id>.
  * Anchors are never inserted inside <a>, <h1>-<h6>, <code>, <pre>, an attribute, or the
    course CTA paragraph. Every rewrite is verified to preserve the visible text exactly.
  * Canonical host is https://anandrochlani.com — never emit www URLs.
`;

function parseArgs(argv) {
  const args = {
    apply: false, yes: false, verbose: false, json: false, help: false,
    selfCheck: false, fetchLive: false, writeKeywordMap: true, post: null,
    articlesDir: PATHS.articles,
    opt: { ...DEFAULTS },
  };
  const num = (v, name) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) throw new Error(`${name} expects a non-negative number, got "${v}"`);
    return n;
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} expects a value`);
      return v;
    };
    switch (a) {
      case '--help': case '-h': args.help = true; break;
      case '--apply': args.apply = true; break;
      case '--yes': case '-y': args.yes = true; break;
      case '--verbose': case '-v': args.verbose = true; break;
      case '--json': args.json = true; break;
      case '--self-check': args.selfCheck = true; break;
      case '--fetch-live': args.fetchLive = true; break;
      case '--no-keyword-map': args.writeKeywordMap = false; break;
      case '--post': args.post = next().replace(/^\/blog\//, ''); break;
      case '--articles-dir': args.articlesDir = path.resolve(next()); break;
      case '--max-links': args.opt.maxLinks = num(next(), '--max-links'); break;
      case '--max-per-target': args.opt.maxPerTarget = num(next(), '--max-per-target'); break;
      case '--min-distance': args.opt.minDistance = num(next(), '--min-distance'); break;
      case '--min-next-step': args.opt.minNextStep = num(next(), '--min-next-step'); break;
      case '--anchor-repeat': args.opt.anchorRepeatThreshold = num(next(), '--anchor-repeat'); break;
      default:
        throw new Error(`unknown option "${a}" (try --help)`);
    }
  }
  return args;
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exit(2);
  }
  if (args.help) {
    console.log(HELP.trim());
    return 0;
  }

  // ---- 0. HTML safety fixtures always run first ------------------------
  const fixtures = runFixtures();
  if (!fixtures.ok) {
    console.error('SELF-CHECK FAILED — refusing to run:');
    for (const f of fixtures.failures) console.error(`  ✗ ${f}`);
    return 1;
  }
  if (args.selfCheck) {
    console.log(`self-check: ${fixtures.total}/${fixtures.total} HTML safety checks passed.`);
    return 0;
  }

  // ---- 1. load the post universe ---------------------------------------
  const drafts = loadDrafts(args.articlesDir);
  let live = loadSnapshot(PATHS.reference);
  if (args.fetchLive) {
    try {
      const fresh = await fetchLive();
      const bySlug = new Map(live.map((p) => [p.slug, p]));
      for (const p of fresh) bySlug.set(p.slug, p);
      live = [...bySlug.values()];
      console.log(`fetched ${fresh.length} published posts from the live API.`);
    } catch (e) {
      console.warn(`warn: live fetch failed (${e.message}); using reference snapshot only.`);
    }
  }
  const posts = mergePosts({ drafts, live });
  if (!posts.length) {
    console.error('error: no posts found — check --articles-dir and reference/live_posts_*.json');
    return 1;
  }
  const { plan, bySlug: planBySlug } = loadPlan(PATHS.plan);
  const plannedSlugs = new Set((plan.queue || []).map((q) => q.slug));

  if (args.post && !posts.some((p) => p.slug === args.post)) {
    console.error(`error: --post "${args.post}" is not a known post. Known slugs:`);
    for (const p of posts.filter((x) => x.linkable)) console.error(`  ${p.slug}`);
    return 2;
  }

  // ---- 2. keyword map ---------------------------------------------------
  const { doc: keywordDoc } = buildKeywordMap({
    posts,
    planBySlug,
    mapFile: PATHS.keywordMap,
    seedFile: PATHS.keywordSeeds,
    write: args.writeKeywordMap,
  });
  const keywordStats = {
    posts: Object.keys(keywordDoc.posts).length,
    phrases: Object.values(keywordDoc.posts).reduce((n, p) => n + p.keywords.length, 0),
    ambiguousDropped: keywordDoc.ambiguousPhrases.length,
    file: path.relative(process.cwd(), PATHS.keywordMap),
  };

  // ---- 3. graph + opportunities ----------------------------------------
  const graph = buildGraph(posts, plannedSlugs);
  const { plans, totalCandidates } = findOpportunities({
    posts,
    graph,
    keywordMap: keywordDoc.posts,
    options: args.opt,
    onlyPost: args.post,
  });

  // ---- 4. round-trip safety check on every planned rewrite -------------
  const postsBySlug = new Map(posts.map((p) => [p.slug, p]));
  const rt = roundTrip(plans, postsBySlug);
  if (!rt.ok) {
    console.error('ROUND-TRIP CHECK FAILED — proposals would corrupt content:');
    for (const r of rt.results.filter((x) => !x.ok)) {
      console.error(`  ✗ ${r.slug}: ${r.errors.join('; ')}`);
    }
    return 1;
  }

  // ---- 5. report --------------------------------------------------------
  const report = buildReport({
    posts, graph, plans, opt: args.opt, totalCandidates, keywordStats,
    sources: plans.length, keywordMap: keywordDoc.posts,
  });
  report.selfCheck = {
    htmlFixtures: `${fixtures.total}/${fixtures.total} passed`,
    roundTrip: rt.results.map((r) => ({
      slug: r.slug,
      ok: r.ok,
      inserted: r.inserted,
      textCharsBefore: r.textBefore,
      textCharsAfter: r.textAfter,
      textPreserved: r.textBefore === r.textAfter,
      bytesAdded: r.bytesAfter - r.bytesBefore,
    })),
  };

  fs.mkdirSync(PATHS.reports, { recursive: true });
  fs.writeFileSync(PATHS.reportFile, `${JSON.stringify(report, null, 2)}\n`);

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report, { verbose: args.verbose });
    console.log(`  self-check: ${fixtures.total} HTML fixtures passed; ` +
      `${rt.results.length} rewrite(s) round-tripped with visible text preserved.`);
    if (args.writeKeywordMap) console.log(`  keyword map → ${path.relative(process.cwd(), PATHS.keywordMap)}`);
    console.log(`  report      → ${path.relative(process.cwd(), PATHS.reportFile)}`);
  }

  // ---- 6. apply ---------------------------------------------------------
  // Broken /blog/ links are real 404s, so they fail the run (orphans, dead ends and
  // anchor warnings are advisory and do not).
  const exitCode = graph.broken.length ? 1 : 0;

  if (!args.apply) {
    if (!args.json) {
      console.log('');
      if (exitCode) console.log(`  FAIL: ${graph.broken.length} broken internal link(s) — fix these first.`);
      console.log('  Read-only run. Nothing was modified. Use --apply --yes to rewrite drafts.');
    }
    return exitCode;
  }

  const writable = plans.filter((p) => p.editable && p.insertions.length);
  const readonlyPlans = plans.filter((p) => !p.editable && p.insertions.length);

  console.log('');
  console.log('─'.repeat(78));
  console.log(`  APPLY PLAN — ${writable.reduce((n, p) => n + p.insertions.length, 0)} link(s) into ${writable.length} draft file(s)`);
  console.log('─'.repeat(78));
  for (const p of writable) {
    console.log(`  ${path.relative(process.cwd(), p.file)}  (+${p.insertions.length})`);
    for (const i of p.insertions) console.log(`      "${i.anchorText}" → ${i.targetUrl}`);
  }
  if (readonlyPlans.length) {
    console.log('');
    console.log(`  ${readonlyPlans.reduce((n, p) => n + p.insertions.length, 0)} further link(s) proposed for ${readonlyPlans.length} PUBLISHED post(s) — not written here.`);
    console.log('  Apply those with PUT /api/admin/blog-posts?id=<id> (see reports/internal-links.json).');
  }

  if (!args.yes) {
    console.log('');
    console.log('  --apply requires --yes. Nothing was written.');
    return 0;
  }
  if (!writable.length) {
    console.log('');
    console.log('  Nothing to write.');
    return 0;
  }

  console.log('');
  console.log('─'.repeat(78));
  console.log('  DIFF SUMMARY');
  console.log('─'.repeat(78));
  let written = 0;
  let linksAdded = 0;
  for (const p of writable) {
    const raw = JSON.parse(fs.readFileSync(p.file, 'utf8'));
    const before = raw.content;
    if (before !== postsBySlug.get(p.slug).content) {
      console.error(`  ✗ ${path.basename(p.file)}: file changed on disk since the scan — skipped.`);
      continue;
    }
    const after = rewriteContent(before, p.insertions);
    const v = verifyRewrite(before, after, p.insertions.length);
    if (!v.ok) {
      console.error(`  ✗ ${path.basename(p.file)}: ${v.errors.join('; ')} — skipped.`);
      continue;
    }
    if (textOnly(before) !== textOnly(after)) {
      console.error(`  ✗ ${path.basename(p.file)}: visible text would change — skipped.`);
      continue;
    }
    raw.content = after;
    fs.writeFileSync(p.file, `${JSON.stringify(raw, null, 2)}\n`);
    written += 1;
    linksAdded += p.insertions.length;
    const totalLinks = (after.match(/href="\/blog\//g) || []).length;
    console.log(
      `  ✓ ${path.basename(p.file)}  +${p.insertions.length} link(s)  ` +
        `(${totalLinks} internal total)  +${after.length - before.length} bytes  ` +
        `text ${v.textBefore} chars unchanged`
    );
    for (const i of p.insertions) {
      console.log(`      ${i.direction === 'next-step' ? '↑' : i.direction === 'prerequisite' ? '↓' : '→'} "${i.anchorText}" → ${i.targetUrl}`);
    }
  }
  console.log('─'.repeat(78));
  console.log(`  ${written} file(s) rewritten, ${linksAdded} link(s) added. Visible text unchanged everywhere.`);
  console.log('  Next: node seo-pipeline/qa.mjs');
  return written === writable.length ? exitCode : 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    process.exit(await main());
  } catch (e) {
    console.error(`fatal: ${e.stack || e.message}`);
    process.exit(1);
  }
}
