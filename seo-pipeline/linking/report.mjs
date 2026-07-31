/**
 * Console + JSON reporting for the internal-linking engine.
 */
import { overOptimisedAnchors } from './graph.mjs';

const bar = (n, max, width = 24) => {
  if (max <= 0) return '';
  const filled = Math.round((n / max) * width);
  return '#'.repeat(filled) + '.'.repeat(Math.max(0, width - filled));
};

const pad = (s, n) => String(s).padEnd(n).slice(0, n);
const trunc = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * Manual fixes for the posts the mention-scanner cannot help: an orphan nobody
 * mentions, or a dead end with no linkable mention in its body. These need a
 * sentence written by hand, so we say exactly where and with what anchor.
 */
function manualRecommendations({ posts, perPost, keywordMap }) {
  const linkable = posts.filter((p) => p.linkable);
  const byOrder = new Map(linkable.filter((p) => p.order != null).map((p) => [p.order, p]));
  const recs = [];
  for (const p of perPost) {
    const topAnchor = (keywordMap[p.slug]?.keywords || [])[0]?.phrase || p.title;
    if (p.stillOrphanAfter) {
      const neighbours = [p.order - 1, p.order + 1, p.order - 2, p.order + 2]
        .map((o) => byOrder.get(o))
        .filter((n) => n && n.slug !== p.slug)
        .slice(0, 2);
      recs.push({
        kind: 'orphan-needs-manual-link',
        slug: p.slug,
        detail: 'no other post mentions any of its keywords in plain text',
        suggestedAnchor: topAnchor,
        suggestedSources: neighbours.map((n) => n.slug),
        where: 'add a sentence in the "Next Steps" section of the neighbouring tutorial(s)',
      });
    }
    if (p.stillDeadEndAfter) {
      const prereq = byOrder.get((p.order ?? 1) - 1);
      recs.push({
        kind: 'dead-end-needs-manual-link',
        slug: p.slug,
        detail: 'its body mentions no other post\'s keywords',
        suggestedTargets: prereq ? [prereq.slug] : [],
        where: 'add a "Next Steps"/prerequisite sentence linking the previous tutorial',
      });
    }
  }
  return recs;
}

export function buildReport({ posts, graph, plans, opt, totalCandidates, keywordStats, sources, keywordMap = {} }) {
  const linkable = posts.filter((p) => p.linkable);

  // Anchor-text health is judged on the projected state: what exists today plus
  // everything this run would insert.
  const projectedAnchorUsage = new Map();
  for (const [text, uses] of graph.anchorUsage) projectedAnchorUsage.set(text, [...uses]);
  for (const plan of plans) {
    for (const ins of plan.insertions) {
      const key = ins.anchorText.toLowerCase();
      const list = projectedAnchorUsage.get(key) || [];
      list.push({ source: plan.slug, target: ins.target, proposed: true });
      projectedAnchorUsage.set(key, list);
    }
  }
  const overOpt = overOptimisedAnchors(projectedAnchorUsage, opt.anchorRepeatThreshold);

  // Projected graph if every proposal is accepted.
  const projInbound = new Map(linkable.map((p) => [p.slug, graph.inboundCount(p.slug)]));
  const projOutbound = new Map(linkable.map((p) => [p.slug, graph.outboundCount(p.slug)]));
  for (const plan of plans) {
    for (const ins of plan.insertions) {
      projInbound.set(ins.target, (projInbound.get(ins.target) || 0) + 1);
      projOutbound.set(plan.slug, (projOutbound.get(plan.slug) || 0) + 1);
    }
  }

  const perPost = linkable.map((p) => {
    const plan = plans.find((x) => x.slug === p.slug);
    return {
      slug: p.slug,
      title: p.title,
      order: p.order,
      status: p.source,
      editable: p.editable,
      inbound: graph.inboundCount(p.slug),
      outbound: graph.outboundCount(p.slug),
      inboundFrom: [...(graph.inbound.get(p.slug) || [])],
      outboundTo: [...(graph.outbound.get(p.slug) || [])],
      proposed: plan ? plan.insertions.length : 0,
      projectedInbound: projInbound.get(p.slug) ?? 0,
      projectedOutbound: projOutbound.get(p.slug) ?? 0,
      orphan: graph.inboundCount(p.slug) === 0,
      deadEnd: graph.outboundCount(p.slug) === 0,
      stillOrphanAfter: (projInbound.get(p.slug) ?? 0) === 0,
      stillDeadEndAfter: (projOutbound.get(p.slug) ?? 0) === 0,
    };
  });

  const proposals = plans
    .filter((p) => p.insertions.length)
    .map((p) => ({
      source: p.slug,
      sourceTitle: p.title,
      sourceOrder: p.order,
      file: p.file,
      editable: p.editable,
      status: p.status,
      existingInternalLinks: p.existingOutboundCount,
      linkBudget: p.budget,
      prerequisites: p.prerequisites,
      nextSteps: p.nextSteps,
      insertions: p.insertions.map((i) => ({
        target: i.target,
        targetTitle: i.targetTitle,
        targetUrl: i.targetUrl,
        direction: i.direction,
        anchorText: i.anchorText,
        keyword: i.phrase,
        keywordSource: i.keywordSource,
        score: i.score,
        reasons: i.reasons,
        htmlOffset: i.htmlStart,
        before: i.before,
        after: i.after,
      })),
    }));

  return {
    generatedAt: new Date().toISOString(),
    rules: opt,
    summary: {
      postsAnalysed: posts.length,
      linkablePosts: linkable.length,
      excludedPosts: posts.length - linkable.length,
      draftPosts: posts.filter((p) => p.source === 'draft').length,
      livePosts: posts.filter((p) => p.source === 'live').length,
      sourcesScanned: sources,
      existingInternalLinks: graph.links.length,
      orphans: graph.orphans.length,
      deadEnds: graph.deadEnds.length,
      brokenLinks: graph.broken.length,
      pendingLinks: graph.pending.length,
      hrefIssues: graph.issues.length,
      candidateMentions: totalCandidates,
      proposedInsertions: plans.reduce((n, p) => n + p.insertions.length, 0),
      proposedInEditableDrafts: plans
        .filter((p) => p.editable)
        .reduce((n, p) => n + p.insertions.length, 0),
      orphansAfter: perPost.filter((p) => p.stillOrphanAfter).length,
      deadEndsAfter: perPost.filter((p) => p.stillDeadEndAfter).length,
      // ARTICLE_SPEC.md asks for 2-4 internal links per article; --max-links defaults
      // to 8, so surface any post the proposals would push past the spec guidance.
      postsAboveSpecGuidance: perPost
        .filter((p) => p.projectedOutbound > 4)
        .map((p) => ({ slug: p.slug, links: p.projectedOutbound })),
      keywords: keywordStats,
    },
    orphans: graph.orphans.map((p) => ({ slug: p.slug, title: p.title, order: p.order })),
    deadEnds: graph.deadEnds.map((p) => ({ slug: p.slug, title: p.title, order: p.order, editable: p.editable })),
    brokenLinks: graph.broken,
    pendingLinks: graph.pending,
    hrefIssues: graph.issues,
    overOptimisedAnchors: overOpt,
    manualRecommendations: manualRecommendations({ posts, perPost, keywordMap }),
    perPost,
    proposals,
  };
}

export function printReport(report, { verbose = false } = {}) {
  const s = report.summary;
  const line = (c = '─') => console.log(c.repeat(78));

  line('═');
  console.log('  INTERNAL LINKING REPORT — anandrochlani.com');
  line('═');
  console.log(
    `  posts: ${s.postsAnalysed} total  |  ${s.linkablePosts} linkable ` +
      `(${s.draftPosts} draft, ${s.livePosts} live)  |  ${s.excludedPosts} excluded (off-topic)`
  );
  console.log(
    `  existing internal links: ${s.existingInternalLinks}   ` +
      `orphans: ${s.orphans}   dead ends: ${s.deadEnds}   broken: ${s.brokenLinks}`
  );
  console.log(
    `  keyword map: ${s.keywords.phrases} phrases over ${s.keywords.posts} posts ` +
      `(${s.keywords.ambiguousDropped} ambiguous resolved)`
  );
  console.log(
    `  opportunities: ${s.candidateMentions} candidate mentions → ${s.proposedInsertions} proposed links ` +
      `(${s.proposedInEditableDrafts} in editable drafts)`
  );
  console.log(`  after applying: orphans ${s.orphans} → ${s.orphansAfter}, dead ends ${s.deadEnds} → ${s.deadEndsAfter}`);
  if (s.postsAboveSpecGuidance.length) {
    console.log(
      `  note: ${s.postsAboveSpecGuidance.length} post(s) would exceed ARTICLE_SPEC's 2-4 internal links ` +
        `(--max-links is ${report.rules.maxLinks}): ` +
        s.postsAboveSpecGuidance.map((p) => `${p.slug.slice(0, 28)}…=${p.links}`).join(', ')
    );
  }

  // ---- link graph table ----
  console.log('');
  line();
  console.log('  LINK GRAPH  (in = inbound internal links, +N = proposed)');
  line();
  const maxIn = Math.max(1, ...report.perPost.map((p) => p.projectedInbound));
  console.log(`  ${pad('#', 4)}${pad('post', 46)}${pad('in', 5)}${pad('out', 5)}${pad('+in', 5)}`);
  for (const p of report.perPost) {
    const flags = [p.orphan ? 'ORPHAN' : '', p.deadEnd ? 'DEAD-END' : ''].filter(Boolean).join(',');
    const gained = p.projectedInbound - p.inbound;
    console.log(
      `  ${pad(p.order ?? '-', 4)}${pad(trunc(p.slug, 44), 46)}` +
        `${pad(p.inbound, 5)}${pad(p.outbound, 5)}${pad(gained ? `+${gained}` : '', 5)}` +
        `${bar(p.projectedInbound, maxIn)} ${flags}`
    );
  }

  // ---- orphans / dead ends ----
  if (report.orphans.length) {
    console.log('');
    line();
    console.log(`  ORPHANS — ${report.orphans.length} post(s) with zero inbound internal links`);
    line();
    for (const o of report.orphans) {
      const after = report.perPost.find((p) => p.slug === o.slug);
      const fix = after && !after.stillOrphanAfter ? `fixed by ${after.projectedInbound} proposed link(s)` : 'NOT fixed by this run';
      console.log(`  • [${o.order ?? '-'}] ${o.slug}\n      ${fix}`);
    }
  }
  if (report.deadEnds.length) {
    console.log('');
    line();
    console.log(`  DEAD ENDS — ${report.deadEnds.length} post(s) with zero outbound internal links`);
    line();
    for (const d of report.deadEnds) {
      const after = report.perPost.find((p) => p.slug === d.slug);
      const fix = after && !after.stillDeadEndAfter
        ? `${after.proposed} outbound link(s) proposed${d.editable ? '' : ' (live post — apply via admin API)'}`
        : 'no outbound opportunity found';
      console.log(`  • [${d.order ?? '-'}] ${d.slug}\n      ${fix}`);
    }
  }

  // ---- broken / pending / href issues ----
  console.log('');
  line();
  console.log(`  BROKEN INTERNAL LINKS — ${report.brokenLinks.length}`);
  line();
  if (!report.brokenLinks.length) console.log('  none — every /blog/<slug> href resolves to a known post');
  for (const b of report.brokenLinks) console.log(`  ✗ ${b.source}\n      → ${b.href}  ("${b.anchor}")`);

  if (report.pendingLinks.length) {
    console.log('');
    console.log(`  PENDING LINKS — ${report.pendingLinks.length} link(s) to planned-but-unpublished slugs:`);
    for (const p of report.pendingLinks) console.log(`  ! ${p.source}\n      → ${p.href}  (queued in content-plan.json, will 404 until published)`);
  }
  if (report.hrefIssues.length) {
    console.log('');
    console.log(`  HREF ISSUES — ${report.hrefIssues.length}`);
    for (const i of report.hrefIssues) console.log(`  ! [${i.kind}] ${i.source} → ${i.href}\n      ${i.detail}`);
  }

  // ---- anchor over-optimisation ----
  console.log('');
  line();
  console.log(`  ANCHOR TEXT — over-optimisation flags: ${report.overOptimisedAnchors.length}`);
  line();
  if (!report.overOptimisedAnchors.length) console.log('  none — anchor text is well varied');
  for (const f of report.overOptimisedAnchors) console.log(`  ! ${f.detail} → ${f.targets.join(', ')}`);

  // ---- manual recommendations ----
  if (report.manualRecommendations.length) {
    console.log('');
    line();
    console.log(`  NEEDS A HUMAN — ${report.manualRecommendations.length} fix(es) the scanner cannot make`);
    line();
    for (const r of report.manualRecommendations) {
      console.log(`  • [${r.kind}] ${r.slug}`);
      console.log(`      ${r.detail}`);
      if (r.suggestedSources?.length)
        console.log(`      link it FROM: ${r.suggestedSources.join(', ')}  (anchor: "${r.suggestedAnchor}")`);
      if (r.suggestedTargets?.length) console.log(`      link it TO: ${r.suggestedTargets.join(', ')}`);
      console.log(`      ${r.where}`);
    }
  }

  // ---- proposals ----
  console.log('');
  line('═');
  console.log(`  PROPOSED INSERTIONS — ${s.proposedInsertions} across ${report.proposals.length} post(s)`);
  line('═');
  for (const p of report.proposals) {
    console.log('');
    console.log(
      `  ${p.editable ? '[draft]' : '[live] '} [${p.sourceOrder ?? '-'}] ${p.source}  ` +
        `(${p.existingInternalLinks} existing → ${p.existingInternalLinks + p.insertions.length} links)`
    );
    if (!p.editable) console.log('      live post — --apply cannot edit it; update via PUT /api/admin/blog-posts?id=<id>');
    for (const i of p.insertions) {
      const tag = i.direction === 'prerequisite' ? '↓ prereq  ' : i.direction === 'next-step' ? '↑ next    ' : '→ lateral ';
      console.log(`    ${tag} "${i.anchorText}"  →  ${i.targetUrl}   [score ${i.score}]`);
      if (verbose) {
        console.log(`        why: ${i.reasons.join('; ')}`);
        console.log(`        before: …${trunc(i.before.replace(/\s+/g, ' '), 150)}…`);
        console.log(`        after : …${trunc(i.after.replace(/\s+/g, ' '), 165)}…`);
      }
    }
  }
  console.log('');
}
