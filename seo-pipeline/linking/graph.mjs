/**
 * Internal link graph over the merged post universe.
 * Everything here is read-only analysis of the CURRENT state of the content.
 */
import { anchors } from './html.mjs';

const BLOG_HREF_RE = /^\/blog\/([a-z0-9-]+)\/?$/i;

/**
 * @param {Array} posts merged post universe
 * @param {Set<string>} plannedSlugs slugs that exist in content-plan.json but are not published yet
 */
export function buildGraph(posts, plannedSlugs = new Set()) {
  const known = new Set(posts.map((p) => p.slug));
  const bySlug = new Map(posts.map((p) => [p.slug, p]));

  const outbound = new Map(posts.map((p) => [p.slug, new Set()]));
  const inbound = new Map(posts.map((p) => [p.slug, new Set()]));
  const anchorUsage = new Map(); // "anchor text" -> [{source, target}]
  const broken = [];
  const pending = [];
  const issues = [];
  const links = [];

  for (const post of posts) {
    for (const a of anchors(post.content)) {
      const href = a.href.trim();

      if (/^https?:\/\/(www\.)?anandrochlani\.com/i.test(href)) {
        issues.push({
          source: post.slug,
          href,
          kind: /^https?:\/\/www\./i.test(href) ? 'www-absolute-url' : 'absolute-self-url',
          detail: /^https?:\/\/www\./i.test(href)
            ? 'www.anandrochlani.com has a broken TLS certificate — use a relative /blog/<slug> URL'
            : 'use a relative /blog/<slug> URL instead of an absolute self-referencing URL',
        });
      }

      const m = BLOG_HREF_RE.exec(href);
      if (!m) continue;
      const target = m[1];

      links.push({ source: post.slug, target, anchor: a.text, offset: a.start });

      if (target === post.slug) {
        issues.push({ source: post.slug, href, kind: 'self-link', detail: 'post links to itself' });
        continue;
      }
      if (!known.has(target)) {
        (plannedSlugs.has(target) ? pending : broken).push({
          source: post.slug,
          sourceFile: post.file,
          href,
          target,
          anchor: a.text,
        });
        continue;
      }
      outbound.get(post.slug).add(target);
      inbound.get(target).add(post.slug);

      const key = a.text.toLowerCase();
      const list = anchorUsage.get(key) || [];
      list.push({ source: post.slug, target });
      anchorUsage.set(key, list);
    }
  }

  const linkable = posts.filter((p) => p.linkable);
  const orphans = linkable.filter((p) => inbound.get(p.slug).size === 0);
  const deadEnds = linkable.filter((p) => outbound.get(p.slug).size === 0);

  return {
    posts,
    bySlug,
    known,
    outbound,
    inbound,
    links,
    anchorUsage,
    broken,
    pending,
    issues,
    orphans,
    deadEnds,
    inboundCount: (slug) => (inbound.get(slug) || new Set()).size,
    outboundCount: (slug) => (outbound.get(slug) || new Set()).size,
  };
}

/**
 * Anchor texts that are repeated so often they read as over-optimisation,
 * plus anchor texts that point at more than one destination (confusing signal).
 * @param {Map} anchorUsage
 * @param {number} threshold
 */
export function overOptimisedAnchors(anchorUsage, threshold = 3) {
  const flags = [];
  for (const [text, uses] of anchorUsage) {
    const targets = new Set(uses.map((u) => u.target));
    const proposed = uses.filter((u) => u.proposed).length;
    if (uses.length >= threshold) {
      flags.push({
        anchor: text,
        uses: uses.length,
        existingUses: uses.length - proposed,
        proposedUses: proposed,
        targets: [...targets],
        sources: uses.map((u) => u.source),
        kind: 'exact-match-repetition',
        detail:
          `exact anchor "${text}" used ${uses.length}x site-wide` +
          (proposed ? ` (${uses.length - proposed} existing + ${proposed} proposed)` : ''),
      });
    }
    if (targets.size > 1) {
      flags.push({
        anchor: text,
        uses: uses.length,
        targets: [...targets],
        kind: 'ambiguous-anchor',
        detail: `anchor "${text}" points at ${targets.size} different posts`,
      });
    }
  }
  return flags.sort((a, b) => b.uses - a.uses);
}
