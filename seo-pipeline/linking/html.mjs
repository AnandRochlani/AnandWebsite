/**
 * Minimal, dependency-free HTML utilities for safe link insertion.
 *
 * We never build a real DOM. Instead we tokenise the raw HTML string into
 * "text regions" (the spans of characters that live BETWEEN tags) while
 * tracking an element stack. A region is `safe` for link insertion only when:
 *
 *   - it is not inside any protected element (<a>, <h1>-<h6>, <code>, <pre>, ...)
 *   - it IS inside a block-level text host (<p>, <li>, <td>, ...)
 *
 * Because a region is by definition a span between two tags, a match found
 * inside a region can never straddle a tag boundary and can never land inside
 * an attribute value. That property is what makes the rewrite safe.
 */

/** Elements whose text must never be turned into a link. */
export const PROTECTED_TAGS = new Set([
  'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'code', 'pre', 'kbd', 'samp', 'var',
  'script', 'style', 'noscript', 'template', 'svg', 'math',
  'button', 'textarea', 'select', 'option', 'label', 'iframe',
]);

/** Block-level containers whose text is fair game for linking. */
export const TEXT_HOST_TAGS = new Set([
  'p', 'li', 'td', 'th', 'dd', 'dt', 'blockquote', 'figcaption', 'caption',
]);

/** HTML void elements — they never push onto the element stack. */
export const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

const TAG_RE = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<[!/]?[a-zA-Z][^>]*>|<\/[a-zA-Z][^>]*>/g;
const TAG_NAME_RE = /^<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9:-]*)/;

/**
 * Split `html` into text regions.
 * @returns {{regions: Array<{start:number,end:number,safe:boolean,stack:string[]}>, totalText:number}}
 */
export function scanRegions(html) {
  const regions = [];
  const stack = [];
  let protectedDepth = 0;

  const pushRegion = (start, end) => {
    if (end <= start) return;
    regions.push({
      start,
      end,
      safe: protectedDepth === 0 && stack.some((t) => TEXT_HOST_TAGS.has(t)),
      stack: stack.slice(),
    });
  };

  TAG_RE.lastIndex = 0;
  let last = 0;
  let m;
  while ((m = TAG_RE.exec(html)) !== null) {
    if (m.index > last) pushRegion(last, m.index);
    last = TAG_RE.lastIndex;

    const tag = m[0];
    if (tag.startsWith('<!')) continue; // comment / doctype / CDATA

    const nm = TAG_NAME_RE.exec(tag);
    if (!nm) continue;
    const closing = nm[1] === '/';
    const name = nm[2].toLowerCase();

    if (closing) {
      const idx = stack.lastIndexOf(name);
      if (idx !== -1) stack.length = idx; // pop through the matching open tag
    } else if (!VOID_TAGS.has(name) && !/\/\s*>$/.test(tag)) {
      stack.push(name);
    }
    protectedDepth = stack.reduce((n, t) => n + (PROTECTED_TAGS.has(t) ? 1 : 0), 0);
  }
  if (last < html.length) pushRegion(last, html.length);

  const totalText = regions.reduce((n, r) => n + (r.end - r.start), 0);
  return { regions, totalText };
}

/**
 * Map an HTML character offset to an approximate plain-text offset.
 * Used to keep inserted links a minimum reading distance apart.
 */
export function makeTextMapper(regions) {
  const bounds = [];
  let acc = 0;
  for (const r of regions) {
    bounds.push({ start: r.start, end: r.end, textStart: acc });
    acc += r.end - r.start;
  }
  return {
    total: acc,
    at(offset) {
      if (!bounds.length) return 0;
      let lo = 0;
      let hi = bounds.length - 1;
      let pick = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (bounds[mid].start <= offset) {
          pick = mid;
          lo = mid + 1;
        } else hi = mid - 1;
      }
      const b = bounds[pick];
      if (offset <= b.start) return b.textStart;
      if (offset >= b.end) return b.textStart + (b.end - b.start);
      return b.textStart + (offset - b.start);
    },
  };
}

const RX_SPECIAL = /[.*+?^${}()|[\]\\]/g;
const esc = (s) => s.replace(RX_SPECIAL, '\\$&');

/**
 * Build a tolerant matcher for a keyword phrase:
 *  - case-insensitive
 *  - words may be separated by whitespace or hyphens ("fan out" ~ "fan-out")
 *  - the final word matches singular or plural ("virtual node" ~ "virtual nodes")
 *  - hard word boundaries so "cache" never matches inside "caches"
 */
export function phraseRegex(phrase) {
  const words = String(phrase).trim().toLowerCase().split(/[\s\-_]+/).filter(Boolean);
  if (!words.length) return null;
  const parts = words.map((w, i) => {
    if (i < words.length - 1) return esc(w);
    if (w.endsWith('s') && w.length > 3) return `(?:${esc(w)}|${esc(w.slice(0, -1))})`;
    return `${esc(w)}(?:s)?`;
  });
  return new RegExp(`(?<![A-Za-z0-9])${parts.join('[\\s\\u00a0-]+')}(?![A-Za-z0-9])`, 'gi');
}

/**
 * Find every occurrence of `phrase` in the linkable text of `html`.
 * @returns {Array<{start:number,end:number,text:string}>} document-ordered matches
 */
export function findPhraseMatches(html, regions, phrase) {
  const re = phraseRegex(phrase);
  if (!re) return [];
  const out = [];
  for (const r of regions) {
    if (!r.safe) continue;
    const chunk = html.slice(r.start, r.end);
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(chunk)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      const start = r.start + m.index;
      const end = start + m[0].length;
      // Never split an HTML entity.
      if (m[0].includes('&') || m[0].includes(';')) continue;
      if (html[start - 1] === '&') continue;
      // Never anchor half of a hyphenated compound ("consistency-versus-latency").
      if (html[start - 1] === '-' || html[end] === '-') continue;
      // Never anchor part of a dotted token (a domain, a filename).
      if (html[start - 1] === '.' && /[A-Za-z0-9]/.test(html[start - 2] || '')) continue;
      out.push({ start, end, text: m[0] });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Absolute offsets of every existing `<a` open tag. */
export function anchorOffsets(html) {
  const out = [];
  const re = /<a\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) out.push({ start: m.index, tag: m[0] });
  return out;
}

/** Every href in the document, with its offset. */
export function hrefs(html) {
  const out = [];
  const re = /<a\b[^>]*?href\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) out.push({ start: m.index, href: m[1] ?? m[2] ?? '' });
  return out;
}

/** Anchor text of every link, paired with its href. */
export function anchors(html) {
  const out = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const hm = /href\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(m[1]);
    out.push({
      start: m.index,
      href: hm ? (hm[1] ?? hm[2] ?? '') : '',
      text: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    });
  }
  return out;
}

/**
 * Apply insertions right-to-left so earlier offsets stay valid.
 * @param {string} html
 * @param {Array<{start:number,end:number,href:string}>} insertions
 */
export function applyInsertions(html, insertions) {
  const sorted = [...insertions].sort((a, b) => b.start - a.start);
  let out = html;
  let prevStart = Infinity;
  for (const ins of sorted) {
    if (ins.end > prevStart) throw new Error(`overlapping insertions at ${ins.start}`);
    prevStart = ins.start;
    const inner = out.slice(ins.start, ins.end);
    out = `${out.slice(0, ins.start)}<a href="${ins.href}">${inner}</a>${out.slice(ins.end)}`;
  }
  return out;
}

/** Plain text with all markup removed and whitespace collapsed. */
export function textOnly(html) {
  return String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Structural validation of the rewritten HTML.
 * @returns {{ok:boolean, errors:string[]}}
 */
export function validateAnchors(html) {
  const errors = [];
  let depth = 0;
  let maxDepth = 0;
  const re = /<\/?a\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[0].startsWith('</')) {
      depth -= 1;
      if (depth < 0) errors.push(`stray </a> at offset ${m.index}`);
    } else {
      if (!/href\s*=/i.test(m[0])) errors.push(`<a> without href at offset ${m.index}`);
      depth += 1;
      maxDepth = Math.max(maxDepth, depth);
    }
  }
  if (depth !== 0) errors.push(`unbalanced anchors (depth ${depth} at end of document)`);
  if (maxDepth > 1) errors.push(`nested anchors detected (max depth ${maxDepth})`);
  if (/<a\b[^>]*>\s*<\/a\s*>/i.test(html)) errors.push('empty anchor produced');
  return { ok: errors.length === 0, errors };
}

/**
 * Full before/after safety check for a rewrite.
 * @returns {{ok:boolean, errors:string[], textBefore:number, textAfter:number}}
 */
export function verifyRewrite(before, after, expectedInsertions) {
  const errors = [];
  const tBefore = textOnly(before);
  const tAfter = textOnly(after);
  if (tBefore !== tAfter) {
    errors.push(
      `visible text changed (${tBefore.length} chars -> ${tAfter.length} chars)`
    );
  }
  const v = validateAnchors(after);
  errors.push(...v.errors);

  const countA = (s) => (s.match(/<a\b[^>]*>/gi) || []).length;
  const delta = countA(after) - countA(before);
  if (typeof expectedInsertions === 'number' && delta !== expectedInsertions) {
    errors.push(`expected ${expectedInsertions} new anchors, found ${delta}`);
  }
  const openTags = (after.match(/<a\b[^>]*>/gi) || []).length;
  const closeTags = (after.match(/<\/a\s*>/gi) || []).length;
  if (openTags !== closeTags) errors.push(`anchor tag count mismatch: ${openTags} open / ${closeTags} close`);

  return { ok: errors.length === 0, errors, textBefore: tBefore.length, textAfter: tAfter.length };
}
