/**
 * Finds and ranks internal-link opportunities, then applies the linking rules
 * (caps, one-link-per-target, minimum reading distance, anchor variation,
 * prerequisite/next-step balance) to produce a concrete, ordered set of
 * proposed insertions per post.
 */
import {
  scanRegions,
  makeTextMapper,
  findPhraseMatches,
  anchors,
  applyInsertions,
} from './html.mjs';

export const DEFAULTS = {
  maxLinks: 8,
  maxPerTarget: 1,
  minDistance: 350, // plain-text characters between two internal links
  externalLinkGap: 120, // smaller buffer around outbound/external links (YouTube, CTA, docs)
  anchorRepeatThreshold: 3,
  maxSameAnchor: 3, // hard cap on identical anchor text reused site-wide
  minNextStep: 1,
  maxMatchesPerPhrase: 3,
  contextChars: 110,
  maxAnchorChars: 60, // never widen an anchor past this many characters
};

const CTA_HOST = 'udemy.com';

/** Ranges of block elements we refuse to touch (currently: the course CTA paragraph). */
function excludedBlocks(html) {
  const ranges = [];
  const re = /<(p|li|blockquote)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[0].toLowerCase().includes(CTA_HOST)) {
      ranges.push({ start: m.index, end: m.index + m[0].length, reason: 'course CTA block' });
    }
  }
  return ranges;
}

function inRanges(ranges, start, end) {
  return ranges.find((r) => start < r.end && end > r.start) || null;
}

function direction(sourceOrder, targetOrder) {
  if (sourceOrder == null || targetOrder == null) return 'lateral';
  if (targetOrder < sourceOrder) return 'prerequisite';
  if (targetOrder > sourceOrder) return 'next-step';
  return 'lateral';
}

function scoreCandidate({ keyword, dir, orderGap, targetInbound, anchorUses, tailFraction }) {
  const reasons = [];
  let score = keyword.weight;
  reasons.push(`keyword weight ${keyword.weight.toFixed(2)} (${keyword.source})`);

  const words = keyword.phrase.split(/[\s-]+/).length;
  const specificity = Math.min(1, words / 3) * 0.4 + 0.6;
  score *= specificity;
  if (words >= 3) reasons.push('specific multi-word phrase');

  if (dir === 'prerequisite') {
    score += 0.15;
    reasons.push('links down the series to a prerequisite');
  } else if (dir === 'next-step') {
    score += 0.1;
    reasons.push('links up the series to the next step');
  }

  if (orderGap != null) {
    const prox = 0.1 / (1 + orderGap / 5);
    score += prox;
  }

  if (targetInbound === 0) {
    score += 0.25;
    reasons.push('target is an orphan (0 inbound links)');
  } else if (targetInbound < 2) {
    score += 0.1;
    reasons.push('target has weak inbound linking');
  }

  if (anchorUses > 0) {
    const penalty = Math.min(0.3, 0.12 * anchorUses);
    score -= penalty;
    reasons.push(`anchor text already used ${anchorUses}x site-wide (-${penalty.toFixed(2)})`);
  }

  if (tailFraction > 0.9) {
    score -= 0.1;
    reasons.push('mention sits in the closing/takeaways section');
  }

  return { score: Number(score.toFixed(4)), reasons };
}

/**
 * @param {object} opts
 * @param {Array} opts.posts merged universe
 * @param {object} opts.graph from buildGraph()
 * @param {object} opts.keywordMap keyword-map doc (`.posts`)
 * @param {object} opts.options rule overrides
 * @param {string|null} opts.onlyPost scope to a single source slug
 */
export function findOpportunities({ posts, graph, keywordMap, options = {}, onlyPost = null }) {
  const opt = { ...DEFAULTS, ...options };

  // Site-wide anchor usage seeded from links that already exist.
  const anchorUses = new Map();
  for (const [text, uses] of graph.anchorUsage) anchorUses.set(text, uses.length);

  const targets = posts.filter((p) => p.linkable && keywordMap[p.slug]);
  const sources = posts
    .filter((p) => p.linkable && p.content)
    .filter((p) => !onlyPost || p.slug === onlyPost);

  const plans = [];
  let totalCandidates = 0;

  for (const source of sources) {
    const html = source.content;
    const { regions } = scanRegions(html);
    const mapper = makeTextMapper(regions);
    const skipRanges = excludedBlocks(html);
    const existingOutbound = graph.outbound.get(source.slug) || new Set();
    // Existing links occupy space. Internal links keep the full reading distance;
    // external ones (YouTube, docs, the course CTA) only need a small buffer so a
    // single outbound link at the end of a post cannot veto every internal link.
    const existingAnchorOffsets = anchors(html).map((a) => ({
      offset: mapper.at(a.start),
      gap: /^\/blog\//i.test(a.href.trim())
        ? opt.minDistance
        : Math.min(opt.minDistance, opt.externalLinkGap),
    }));
    const totalText = mapper.total || 1;

    const candidates = [];
    for (const target of targets) {
      if (target.slug === source.slug) continue;
      if (existingOutbound.has(target.slug)) continue; // already linked — one per target
      const entry = keywordMap[target.slug];
      const dir = direction(source.order, target.order);
      const orderGap =
        source.order != null && target.order != null ? Math.abs(source.order - target.order) : null;
      const targetInbound = graph.inboundCount(target.slug);

      for (const keyword of entry.keywords) {
        const matches = findPhraseMatches(html, regions, keyword.phrase).slice(
          0,
          opt.maxMatchesPerPhrase
        );
        for (const match of matches) {
          const blocked = inRanges(skipRanges, match.start, match.end);
          if (blocked) continue;
          const textOffset = mapper.at(match.start);
          const { score, reasons } = scoreCandidate({
            keyword,
            dir,
            orderGap,
            targetInbound,
            anchorUses: anchorUses.get(match.text.toLowerCase()) || 0,
            tailFraction: textOffset / totalText,
          });
          candidates.push({
            target: target.slug,
            targetTitle: target.title,
            targetUrl: target.url,
            targetOrder: target.order,
            phrase: keyword.phrase,
            keywordSource: keyword.source,
            anchorText: match.text,
            htmlStart: match.start,
            htmlEnd: match.end,
            textOffset,
            direction: dir,
            score,
            reasons,
          });
          totalCandidates += 1;
        }
      }
    }

    // When several phrases for the SAME target hit overlapping text, keep the
    // richest anchor ("Microservices architecture" beats "Microservices").
    const deduped = [];
    for (const c of candidates.sort((a, b) => a.htmlStart - b.htmlStart || b.htmlEnd - a.htmlEnd)) {
      const clash = deduped.find(
        (d) => d.target === c.target && c.htmlStart < d.htmlEnd && c.htmlEnd > d.htmlStart
      );
      if (!clash) {
        deduped.push(c);
        continue;
      }
      // Overlapping matches always sit inside the same text region, so their union
      // is contiguous, tag-free text: widen the anchor to cover both phrases
      // ("social bookmarking" + "bookmarking service" -> "social bookmarking service").
      const start = Math.min(c.htmlStart, clash.htmlStart);
      const end = Math.max(c.htmlEnd, clash.htmlEnd);
      const base = c.score >= clash.score ? c : clash;
      const widened = { ...base };
      if (end - start <= opt.maxAnchorChars) {
        widened.htmlStart = start;
        widened.htmlEnd = end;
        widened.anchorText = html.slice(start, end);
        widened.textOffset = mapper.at(start);
        if (widened.anchorText !== base.anchorText) {
          widened.reasons = [...base.reasons, `anchor widened to "${widened.anchorText}"`];
        }
      }
      deduped[deduped.indexOf(clash)] = widened;
    }

    const ranked = deduped.sort(
      (a, b) => b.score - a.score || a.textOffset - b.textOffset || a.target.localeCompare(b.target)
    );

    // --- rule enforcement -------------------------------------------------
    const chosen = [];
    const usedTargets = new Map();
    const usedAnchorText = new Set();
    const occupied = [...existingAnchorOffsets];
    const rejected = [];
    const budget = Math.max(0, opt.maxLinks - existingOutbound.size);

    const fits = (c) => {
      if (chosen.length >= budget) return 'post link cap reached';
      if ((usedTargets.get(c.target) || 0) >= opt.maxPerTarget) return 'target already linked from this post';
      const key = c.anchorText.toLowerCase();
      if (usedAnchorText.has(key)) return 'anchor text already used in this post';
      if ((anchorUses.get(key) || 0) >= opt.maxSameAnchor)
        return `anchor "${c.anchorText}" already used ${anchorUses.get(key)}x site-wide`;
      for (const o of occupied) {
        if (Math.abs(o.offset - c.textOffset) < o.gap) return `too close to another link (<${o.gap} chars of text)`;
      }
      for (const ch of chosen) {
        if (c.htmlStart < ch.htmlEnd && c.htmlEnd > ch.htmlStart) return 'overlaps another insertion';
      }
      return null;
    };

    const take = (c) => {
      chosen.push(c);
      usedTargets.set(c.target, (usedTargets.get(c.target) || 0) + 1);
      usedAnchorText.add(c.anchorText.toLowerCase());
      occupied.push({ offset: c.textOffset, gap: opt.minDistance });
      const key = c.anchorText.toLowerCase();
      anchorUses.set(key, (anchorUses.get(key) || 0) + 1);
    };

    // Reserve slots for "next step" links so the series flows forward too.
    let reserved = 0;
    if (opt.minNextStep > 0 && budget > 0) {
      for (const c of ranked) {
        if (reserved >= opt.minNextStep) break;
        if (c.direction !== 'next-step') continue;
        if (fits(c)) continue;
        take(c);
        reserved += 1;
      }
    }

    for (const c of ranked) {
      if (chosen.includes(c)) continue;
      const why = fits(c);
      if (why) {
        rejected.push({ ...c, rejectedBecause: why });
        continue;
      }
      take(c);
    }

    chosen.sort((a, b) => a.htmlStart - b.htmlStart);

    for (const c of chosen) {
      const from = Math.max(0, c.htmlStart - opt.contextChars);
      const to = Math.min(html.length, c.htmlEnd + opt.contextChars);
      c.before = html.slice(from, to);
      c.after =
        html.slice(from, c.htmlStart) +
        `<a href="${c.targetUrl}">${html.slice(c.htmlStart, c.htmlEnd)}</a>` +
        html.slice(c.htmlEnd, to);
    }

    plans.push({
      slug: source.slug,
      title: source.title,
      order: source.order,
      file: source.file,
      editable: source.editable,
      status: source.source,
      existingOutbound: [...existingOutbound],
      existingOutboundCount: existingOutbound.size,
      inboundCount: graph.inboundCount(source.slug),
      budget,
      insertions: chosen,
      prerequisites: chosen.filter((c) => c.direction === 'prerequisite').map((c) => c.target),
      nextSteps: chosen.filter((c) => c.direction === 'next-step').map((c) => c.target),
      rejectedTop: rejected.slice(0, 10),
      candidateCount: candidates.length,
      rankedCount: ranked.length,
    });
  }

  return { plans, totalCandidates };
}

/** Rewrite one post's HTML from its plan. Returns the new content string. */
export function rewriteContent(html, insertions) {
  return applyInsertions(
    html,
    insertions.map((i) => ({ start: i.htmlStart, end: i.htmlEnd, href: i.targetUrl }))
  );
}
