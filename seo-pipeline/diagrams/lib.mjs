/**
 * SVG diagram primitives + layout engines for System Design articles.
 *
 * Visual language is carried over from the LLD Masterclass video decks ("Daylight
 * Classroom"): paper background, a kicker + bold heading over a short indigo underline
 * bar, amber marker handwriting for the human annotations, hand-drawn (wobbly) strokes,
 * and a thin indigo footer band with a diagonal notch carrying attribution. The point of
 * the handwriting is that it reads as a teacher annotating the diagram rather than a tool
 * emitting boxes — that is what makes the image worth looking at and worth sharing.
 *
 * Diagrams are emitted as standalone .svg files under public/diagrams/ and referenced
 * from article HTML with <img src="/diagrams/<id>.svg" alt="...">. Standalone files are
 * used instead of inline <svg> because Google Image Search indexes image FILES; inline
 * SVG is not indexed as an image. It also keeps article HTML (stored in Neon) small and
 * lets a diagram be fixed once and reused across posts.
 *
 * Rendering context: the file is loaded through <img>, so it is an isolated document.
 * No external CSS or webfonts apply — every style must be an attribute, and font-family
 * must be a system stack. Nothing here may use Math.random(): generate.mjs diffs output
 * against the file on disk, so identical input must produce byte-identical output. The
 * hand-drawn wobble is therefore driven by a seeded PRNG.
 */

export const C = {
  brand: '#5553FF',
  brandDark: '#4341D6',
  brandSoft: '#EEEEFF',
  ink: '#0D0B33',
  ink2: '#171450',
  lavender: '#B9A8FF',
  line: '#C9C7F0',
  muted: '#5B5885',
  white: '#FFFFFF',
  paper: '#FAFAF5', // Daylight Classroom paper
  marker: '#B45309', // amber handwriting / annotations
  markerWash: '#FDE68A',
  ok: '#047857',
  okSoft: '#E7F5F0',
  warn: '#DC2626',
  warnSoft: '#FDECEC',
};

const FONT =
  "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const HAND = "Noteworthy, 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive";

const FOOTER_H = 26;
const ATTRIBUTION = 'anandrochlani.com  ·  System Design Tutorial';

const r = (n) => Math.round(n * 100) / 100;

/* --------------------------------------------------------- deterministic rng */

/** Small string-seeded PRNG so the wobble is stable across runs. */
export function rng(seed) {
  let h = 2166136261;
  for (let i = 0; i < String(seed).length; i++) {
    h ^= String(seed).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ text */

// Average glyph advance for the stack above, as a fraction of font-size.
const ADVANCE = 0.545;
const BOLD_ADVANCE = 0.575;
const HAND_ADVANCE = 0.47;

export function textWidth(str, size, bold = false) {
  return String(str).length * size * (bold ? BOLD_ADVANCE : ADVANCE);
}

export function handWidth(str, size) {
  return String(str).length * size * HAND_ADVANCE;
}

/** Greedy word wrap to a pixel width. Returns an array of lines. */
export function wrap(str, size, maxWidth, bold = false) {
  const words = String(str).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (textWidth(next, size, bold) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function textBlock(lines, { x, y, size = 13, fill = C.ink, weight = 400, anchor = 'middle', lineHeight = 1.35, spacing } = {}) {
  const step = size * lineHeight;
  return lines
    .map(
      (line, i) =>
        `<text x="${r(x)}" y="${r(y + i * step)}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${spacing ? ` letter-spacing="${spacing}"` : ''}>${esc(line)}</text>`,
    )
    .join('');
}

/* ------------------------------------------------------- hand-drawn strokes */

/** A slightly irregular line, as if drawn by hand. */
export function wobbleLine(x1, y1, x2, y2, seed, amp = 1.5, segs = 6) {
  const rand = rng(seed);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  let d = `M${r(x1)},${r(y1)}`;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const off = i === segs ? 0 : (rand() - 0.5) * 2 * amp;
    d += ` L${r(x1 + dx * t + nx * off)},${r(y1 + dy * t + ny * off)}`;
  }
  return d;
}

/** Amber marker underline with the wobble of a real pen stroke. */
export function markerUnderline(x, y, width, seed) {
  return `<path d="${wobbleLine(x, y, x + width, y, seed, 1.8, 7)}" stroke="${C.marker}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.85"/>`;
}

/** Hand-drawn ellipse around something worth circling. */
export function circleEmphasis(cx, cy, rx, ry, seed, color = C.warn) {
  const rand = rng(seed);
  const pts = [];
  const steps = 22;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2 - 0.4;
    const jitter = 1 + (rand() - 0.5) * 0.1;
    pts.push([cx + Math.cos(a) * rx * jitter, cy + Math.sin(a) * ry * jitter]);
  }
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r(x)},${r(y)}`).join(' ');
  return `<path d="${d}" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.8"/>`;
}

/** Amber handwritten note. Slight rotation so it never looks typeset. */
export function handwrite(text, { x, y, size = 15, fill = C.marker, anchor = 'start', rotate = -1.2 } = {}) {
  return `<text x="${r(x)}" y="${r(y)}" font-family="${HAND}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" transform="rotate(${rotate} ${r(x)} ${r(y)})">${esc(text)}</text>`;
}

/** Hand-drawn curved arrow, used to point a handwritten note at a box. */
export function handArrow(x1, y1, x2, y2, seed, color = C.marker) {
  const rand = rng(seed);
  const mx = (x1 + x2) / 2 + (rand() - 0.5) * 18;
  const my = (y1 + y2) / 2 - 12 - rand() * 8;
  const ang = Math.atan2(y2 - my, x2 - mx);
  const head = 7;
  const p1 = [x2 - head * Math.cos(ang - 0.42), y2 - head * Math.sin(ang - 0.42)];
  const p2 = [x2 - head * Math.cos(ang + 0.42), y2 - head * Math.sin(ang + 0.42)];
  return (
    `<path d="M${r(x1)},${r(y1)} Q${r(mx)},${r(my)} ${r(x2)},${r(y2)}" stroke="${color}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.85"/>` +
    `<path d="M${r(p1[0])},${r(p1[1])} L${r(x2)},${r(y2)} L${r(p2[0])},${r(p2[1])}" stroke="${color}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`
  );
}

/** Rotated stamp badge — the "SRP VIOLATION" beat from the videos. */
export function stamp(text, { x, y, color = C.warn, angle = -8 } = {}) {
  const size = 12;
  const w = textWidth(text, size, true) + 20;
  const h = 24;
  return (
    `<g transform="rotate(${angle} ${r(x)} ${r(y)})">` +
    `<rect x="${r(x - w / 2)}" y="${r(y - h / 2)}" width="${r(w)}" height="${h}" rx="4" fill="none" stroke="${color}" stroke-width="2.2" opacity="0.9"/>` +
    `<text x="${r(x)}" y="${r(y + 4.5)}" font-family="${FONT}" font-size="${size}" font-weight="800" fill="${color}" text-anchor="middle" letter-spacing="1">${esc(text)}</text>` +
    `</g>`
  );
}

/* ----------------------------------------------------------------- shapes */

const VARIANTS = {
  soft: { fill: C.brandSoft, stroke: C.brand, text: C.ink, sub: C.muted },
  accent: { fill: C.brand, stroke: C.brandDark, text: C.white, sub: '#DCDBFF' },
  plain: { fill: C.white, stroke: C.line, text: C.ink, sub: C.muted },
  dark: { fill: C.ink, stroke: C.ink2, text: C.white, sub: C.lavender },
  warn: { fill: C.warnSoft, stroke: C.warn, text: C.ink, sub: C.warn },
  ok: { fill: C.okSoft, stroke: C.ok, text: C.ink, sub: C.ok },
};

export function box({ x, y, w, h, label, sub, variant = 'soft', radius = 10, dashed = false }) {
  const v = VARIANTS[variant] || VARIANTS.soft;
  const labelSize = 13.5;
  const subSize = 11;
  const labelLines = wrap(label, labelSize, w - 18, true);
  const subLines = sub ? wrap(sub, subSize, w - 16) : [];

  const labelH = labelLines.length * labelSize * 1.3;
  const subH = subLines.length * subSize * 1.3;
  const totalH = labelH + (subH ? subH + 3 : 0);
  const firstBaseline = y + h / 2 - totalH / 2 + labelSize * 0.95;

  return [
    `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${radius}" fill="${v.fill}" stroke="${v.stroke}" stroke-width="1.5"${dashed ? ' stroke-dasharray="5 4"' : ''}/>`,
    textBlock(labelLines, { x: x + w / 2, y: firstBaseline, size: labelSize, fill: v.text, weight: 600, lineHeight: 1.3 }),
    subLines.length
      ? textBlock(subLines, { x: x + w / 2, y: firstBaseline + labelH + subSize * 0.9, size: subSize, fill: v.sub, lineHeight: 1.3 })
      : '',
  ].join('');
}

/** Straight arrow with an optional mid label. */
export function arrow({ x1, y1, x2, y2, label, dashed = false, color = C.ink2, bidir = false }) {
  const parts = [
    `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${color}" stroke-width="1.6" marker-end="url(#ah)"${bidir ? ' marker-start="url(#ah-rev)"' : ''}${dashed ? ' stroke-dasharray="5 4"' : ''} opacity="0.72"/>`,
  ];
  if (label) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const size = 10.5;
    const w = textWidth(label, size) + 10;
    parts.push(
      `<rect x="${r(mx - w / 2)}" y="${r(my - 15)}" width="${r(w)}" height="15" rx="7" fill="${C.paper}" stroke="${C.line}" stroke-width="1"/>`,
      textBlock([label], { x: mx, y: my - 4.5, size, fill: C.muted, weight: 500 }),
    );
  }
  return parts.join('');
}

/* -------------------------------------------------------------- document */

export function svgDoc({ width, height, title, desc, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="t d" preserveAspectRatio="xMidYMid meet">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<defs>
<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.ink2}"/></marker>
<marker id="ah-rev" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M10,0 L0,5 L10,10 z" fill="${C.ink2}"/></marker>
</defs>
<rect width="${width}" height="${height}" fill="${C.paper}"/>
${body}
</svg>`;
}

/**
 * Page chrome: kicker, bold title, short indigo underline bar, optional subtitle.
 * Mirrors the lesson-slide header from the LLD decks.
 */
function header(title, subtitle, width, pad, kicker = 'SYSTEM DESIGN') {
  const parts = [];
  let y = pad + 11;
  parts.push(
    textBlock([kicker], { x: pad, y, size: 10, fill: C.muted, weight: 700, anchor: 'start', spacing: 1.4 }),
  );

  const size = 19;
  y += 26;
  const lines = wrap(title, size, width - pad * 2, true);
  parts.push(textBlock(lines, { x: pad, y, size, fill: C.ink, weight: 800, anchor: 'start', lineHeight: 1.25 }));
  y += (lines.length - 1) * size * 1.25;

  // short indigo underline bar
  y += 12;
  parts.push(`<rect x="${r(pad)}" y="${r(y)}" width="86" height="4" rx="2" fill="${C.brand}"/>`);
  y += 4;

  if (subtitle) {
    y += 20;
    const sl = wrap(subtitle, 12, width - pad * 2);
    parts.push(textBlock(sl, { x: pad, y, size: 12, fill: C.muted, anchor: 'start' }));
    y += (sl.length - 1) * 12 * 1.35;
  }
  return { markup: parts.join(''), nextY: y + 22 };
}

/** Thin indigo footer band with a diagonal notch, carrying attribution. */
function footer(width, height) {
  const top = height - FOOTER_H;
  const notchX = width * 0.18;
  return (
    `<rect x="0" y="${r(top)}" width="${width}" height="${FOOTER_H}" fill="${C.brand}"/>` +
    `<polygon points="${r(notchX)},${r(top)} ${r(notchX + 30)},${r(top)} ${r(notchX + 15)},${r(top + 13)}" fill="${C.paper}"/>` +
    `<text x="${r(width - 18)}" y="${r(top + 17)}" font-family="${FONT}" font-size="10.5" fill="#E6E5FF" text-anchor="end">${esc(ATTRIBUTION)}</text>`
  );
}

/**
 * Handwritten callout pointing at a box.
 * ann = { text, col, node = 0, side = 'below'|'above'|'right', dx = 0, dy = 0 }
 */
function annotate(ann, placed, seed, bounds = {}) {
  const col = placed[ann.col];
  if (!col) return '';
  const node = col.nodes[ann.node || 0];
  if (!node) return '';
  const minX = bounds.minX ?? 0;
  const maxX = bounds.maxX ?? Infinity;

  const size = ann.size || 15;
  const w = handWidth(ann.text, size);
  const side = ann.side || 'below';

  let tx;
  let ty;
  let ax;
  let ay; // arrow target on the box edge
  if (side === 'above') {
    tx = node.x + node.w / 2 - w / 2 + (ann.dx || 0);
    ty = node.y - 26 + (ann.dy || 0);
    ax = node.x + node.w / 2;
    ay = node.y - 5;
  } else if (side === 'right') {
    tx = node.x + node.w + 22 + (ann.dx || 0);
    ty = node.y + node.h / 2 + (ann.dy || 0);
    ax = node.x + node.w + 5;
    ay = node.y + node.h / 2;
  } else {
    tx = node.x + node.w / 2 - w / 2 + (ann.dx || 0);
    ty = node.y + node.h + 34 + (ann.dy || 0);
    ax = node.x + node.w / 2;
    ay = node.y + node.h + 6;
  }

  // A note centred on an edge column runs off the canvas — keep it inside.
  if (side !== 'right') tx = Math.min(Math.max(tx, minX), Math.max(minX, maxX - w));

  const startX = side === 'right' ? tx - 8 : tx + w / 2;
  const startY = side === 'above' ? ty + 6 : ty - 12;
  return (
    handArrow(startX, startY, ax, ay, `${seed}-arrow`, ann.color || C.marker) +
    handwrite(ann.text, { x: tx, y: ty, size, fill: ann.color || C.marker })
  );
}

/* ------------------------------------------------------------- layout: flow */

export function layoutFlow(spec) {
  const pad = 26;
  const nodeGap = 16;
  const nodeW = spec.nodeW || 138;
  const cols = spec.columns;

  const needed = (n) => {
    const labelH = wrap(n.label, 13.5, nodeW - 18, true).length * 13.5 * 1.3;
    const subH = n.sub ? wrap(n.sub, 11, nodeW - 16).length * 11 * 1.3 + 3 : 0;
    return labelH + subH + 22;
  };
  const nodeH = Math.max(spec.nodeH || 62, ...cols.flatMap((c) => c.nodes.map(needed)));

  const widestLabel = Math.max(
    0,
    ...cols.map((c) => (c.edgeLabel ? textWidth(c.edgeLabel, 10.5) + 10 : 0)),
  );
  const anyBus = cols.some(
    (c, i) => i > 0 && (c.bus || cols[i - 1].nodes.length * c.nodes.length > 6),
  );
  const colGap = Math.max(spec.colGap || 54, widestLabel + 22, anyBus ? 78 : 0);

  const contentW = cols.length * nodeW + (cols.length - 1) * colGap;
  // Right-side annotations and corner stamps both need room outside the last column,
  // otherwise they render past the edge of the canvas and get clipped.
  const rightAnn = (spec.annotations || []).some((a) => (a.side || 'below') === 'right');
  const lastColStamped = cols.at(-1).nodes.some((n) => n.stamp);
  const width = Math.max(
    spec.width || 0,
    contentW + pad * 2 + (rightAnn ? 150 : 0) + (lastColStamped ? 46 : 0),
  );

  const head = header(spec.title, spec.kicker, width, pad);
  const topY = head.nextY + (cols.some((c) => c.label) ? 20 : 0);

  const maxNodes = Math.max(...cols.map((c) => c.nodes.length));
  const bandH = maxNodes * nodeH + (maxNodes - 1) * nodeGap;
  const startX = pad;

  const placed = cols.map((col, ci) => {
    const x = startX + ci * (nodeW + colGap);
    const colH = col.nodes.length * nodeH + (col.nodes.length - 1) * nodeGap;
    const y0 = topY + (bandH - colH) / 2;
    return {
      ...col,
      x,
      nodes: col.nodes.map((n, ni) => ({ ...n, x, y: y0 + ni * (nodeH + nodeGap), w: nodeW, h: nodeH })),
    };
  });

  const parts = [head.markup];

  // A handwritten note above a column replaces that column's header — otherwise the
  // note's arrow is drawn straight through the header text.
  const headerSuppressed = new Set(
    (spec.annotations || []).filter((a) => a.side === 'above').map((a) => a.col),
  );

  for (const [ci, col] of placed.entries()) {
    if (!col.label || headerSuppressed.has(ci)) continue;
    parts.push(
      textBlock([col.label.toUpperCase()], {
        x: col.x + nodeW / 2,
        y: topY - 12,
        size: 10,
        fill: C.muted,
        weight: 700,
        spacing: 0.8,
      }),
    );
  }

  for (let i = 0; i < placed.length - 1; i++) {
    const a = placed[i];
    const b = placed[i + 1];
    const edgeLabel = b.edgeLabel;
    const cy = (n) => n.y + nodeH / 2;

    if (b.pair && a.nodes.length === b.nodes.length) {
      a.nodes.forEach((from, ni) => {
        parts.push(arrow({ x1: from.x + nodeW, y1: cy(from), x2: b.x, y2: cy(b.nodes[ni]), dashed: b.dashed }));
      });
      if (edgeLabel) {
        const mx = a.x + nodeW + colGap / 2;
        const my = topY + bandH / 2;
        const w = textWidth(edgeLabel, 10.5) + 10;
        parts.push(
          `<rect x="${r(mx - w / 2)}" y="${r(my - 7.5)}" width="${r(w)}" height="15" rx="7" fill="${C.paper}" stroke="${C.line}"/>`,
          textBlock([edgeLabel], { x: mx, y: my + 3, size: 10.5, fill: C.muted, weight: 500 }),
        );
      }
      continue;
    }

    if (b.bus || a.nodes.length * b.nodes.length > 6) {
      const railA = a.x + nodeW + 14;
      const railB = b.x - 14;
      const midY = topY + bandH / 2;
      const stub = (x1, y1, x2, y2, head2) =>
        `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${C.ink2}" stroke-width="1.6" opacity="0.72"${head2 ? ' marker-end="url(#ah)"' : ''}${b.dashed ? ' stroke-dasharray="5 4"' : ''}/>`;

      if (a.nodes.length > 1) {
        parts.push(stub(railA, cy(a.nodes[0]), railA, cy(a.nodes.at(-1))));
        for (const n of a.nodes) parts.push(stub(n.x + nodeW, cy(n), railA, cy(n)));
      }
      if (b.nodes.length > 1) {
        parts.push(stub(railB, cy(b.nodes[0]), railB, cy(b.nodes.at(-1))));
        for (const n of b.nodes) parts.push(stub(railB, cy(n), n.x, cy(n), true));
      }
      parts.push(
        arrow({
          x1: a.nodes.length > 1 ? railA : a.x + nodeW,
          y1: a.nodes.length > 1 ? midY : cy(a.nodes[0]),
          x2: b.nodes.length > 1 ? railB : b.x,
          y2: b.nodes.length > 1 ? midY : cy(b.nodes[0]),
          label: edgeLabel,
          dashed: b.dashed,
        }),
      );
      continue;
    }

    for (const from of a.nodes) {
      for (const to of b.nodes) {
        parts.push(
          arrow({
            x1: from.x + nodeW,
            y1: cy(from),
            x2: to.x,
            y2: cy(to),
            label: a.nodes.length === 1 && b.nodes.length === 1 ? edgeLabel : undefined,
            dashed: b.dashed,
          }),
        );
      }
    }
  }

  for (const col of placed) for (const n of col.nodes) parts.push(box(n));

  // stamps sit on top of their box
  for (const col of placed) {
    for (const n of col.nodes) {
      if (!n.stamp) continue;
      // Sits across the top-right corner of its box, the way a stamp lands on paper.
      parts.push(stamp(n.stamp, { x: n.x + n.w - 6, y: n.y + 4, color: n.stampColor || C.warn }));
    }
  }

  // handwritten annotations last so they read as drawn on top
  let annBelow = 0;
  for (const [i, ann] of (spec.annotations || []).entries()) {
    parts.push(annotate(ann, placed, `${spec.id}-${i}`, { minX: pad, maxX: width - pad }));
    if ((ann.side || 'below') === 'below') annBelow = Math.max(annBelow, 44 + (ann.dy || 0));
  }

  const height = topY + bandH + annBelow + pad + FOOTER_H;
  parts.push(footer(width, height));

  return svgDoc({ width, height, title: spec.title, desc: spec.alt, body: parts.join('') });
}

/* ------------------------------------------------------------ layout: ring */

export function layoutRing(spec) {
  const pad = 26;
  const width = spec.width || 720;
  const head = header(spec.title, spec.kicker, width, pad);
  const R = spec.radius || 128;
  const cx = width / 2;
  const cy = head.nextY + R + 34;

  const pt = (angle, rad) => {
    const a = ((angle - 90) * Math.PI) / 180;
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  };

  const parts = [head.markup];
  parts.push(`<circle cx="${r(cx)}" cy="${r(cy)}" r="${R}" fill="none" stroke="${C.line}" stroke-width="2"/>`);
  parts.push(textBlock(['hash space', '0 → 2³²−1'], { x: cx, y: cy - 6, size: 11, fill: C.muted, lineHeight: 1.4 }));

  const [ax, ay] = pt(36, R + 15);
  const [bx, by] = pt(52, R + 15);
  parts.push(handArrow(ax, ay, bx, by, `${spec.id}-cw`, C.muted));
  const [cwx, cwy] = pt(44, R + 34);
  parts.push(handwrite('clockwise', { x: cwx, y: cwy, size: 13, fill: C.muted, anchor: 'middle', rotate: 0 }));

  for (const key of spec.keys || []) {
    const [kx, ky] = pt(key.angle, R);
    const [lx, ly] = pt(key.angle, R - 30);
    parts.push(`<circle cx="${r(kx)}" cy="${r(ky)}" r="4.5" fill="${C.lavender}" stroke="${C.paper}" stroke-width="1.5"/>`);
    parts.push(textBlock([key.label], { x: lx, y: ly + 4, size: 10.5, fill: C.muted, weight: 500 }));
  }

  for (const node of spec.nodes || []) {
    const [nx, ny] = pt(node.angle, R);
    const [lx, ly] = pt(node.angle, R + 30);
    const w = Math.max(58, textWidth(node.label, 12, true) + 18);
    parts.push(`<circle cx="${r(nx)}" cy="${r(ny)}" r="7" fill="${node.variant === 'new' ? C.ok : C.brand}" stroke="${C.paper}" stroke-width="2.5"/>`);
    parts.push(
      `<rect x="${r(lx - w / 2)}" y="${r(ly - 11)}" width="${r(w)}" height="22" rx="11" fill="${node.variant === 'new' ? C.okSoft : C.brandSoft}" stroke="${node.variant === 'new' ? C.ok : C.brand}" stroke-width="1.3"/>`,
      textBlock([node.label], { x: lx, y: ly + 4, size: 12, fill: C.ink, weight: 600 }),
    );
  }

  // handwritten note pointing at an arc
  if (spec.note) {
    const [nx, ny] = pt(spec.note.angle, R - 8);
    const tx = pad + 6;
    const ty = cy + R - 6;
    parts.push(handArrow(tx + handWidth(spec.note.text, 15) * 0.5, ty - 12, nx, ny, `${spec.id}-note`));
    parts.push(handwrite(spec.note.text, { x: tx, y: ty, size: 15 }));
  }

  let height = cy + R + 56;
  if (spec.legend) {
    const lx = pad;
    let ly = height - 12;
    for (const item of spec.legend) {
      parts.push(`<circle cx="${r(lx + 5)}" cy="${r(ly - 4)}" r="4.5" fill="${item.color === 'new' ? C.ok : item.color === 'key' ? C.lavender : C.brand}"/>`);
      parts.push(textBlock([item.label], { x: lx + 16, y: ly, size: 11.5, fill: C.muted, anchor: 'start' }));
      ly += 17;
    }
    height = ly + 6;
  }
  height += FOOTER_H;
  parts.push(footer(width, height));

  return svgDoc({ width, height, title: spec.title, desc: spec.alt, body: parts.join('') });
}

/* --------------------------------------------------------- layout: compare */

export function layoutCompare(spec) {
  const pad = 26;
  const width = spec.width || 820;
  const head = header(spec.title, spec.kicker, width, pad);
  const gap = 22;
  const panelW = (width - pad * 2 - gap) / 2;
  const top = head.nextY;

  const rowSize = 12;
  const rowLead = 8;

  const measure = (panel) =>
    panel.rows.reduce((h, row) => h + wrap(row, rowSize, panelW - 44).length * rowSize * 1.35 + rowLead, 0);

  const headerH = 52;
  const bodyH = Math.max(measure(spec.left), measure(spec.right));
  const panelH = headerH + bodyH + 16;

  const parts = [head.markup];

  const drawPanel = (panel, x, accent, soft, seed) => {
    const out = [
      `<rect x="${r(x)}" y="${r(top)}" width="${r(panelW)}" height="${r(panelH)}" rx="12" fill="${C.white}" stroke="${accent}" stroke-width="1.5"/>`,
      `<path d="M${r(x)},${r(top + 12)} a12,12 0 0 1 12,-12 h${r(panelW - 24)} a12,12 0 0 1 12,12 v${r(headerH - 12)} h${r(-panelW)} z" fill="${soft}"/>`,
      textBlock([panel.title], { x: x + panelW / 2, y: top + 24, size: 14, fill: C.ink, weight: 700 }),
    ];
    if (panel.sub) out.push(textBlock([panel.sub], { x: x + panelW / 2, y: top + 41, size: 11, fill: C.muted }));

    let y = top + headerH + 20;
    for (const row of panel.rows) {
      const lines = wrap(row, rowSize, panelW - 44);
      out.push(`<circle cx="${r(x + 20)}" cy="${r(y - 4)}" r="3" fill="${accent}"/>`);
      out.push(textBlock(lines, { x: x + 32, y, size: rowSize, fill: C.ink, anchor: 'start', lineHeight: 1.35 }));
      y += lines.length * rowSize * 1.35 + rowLead;
    }
    // marker underline under the panel title, as if circled while teaching
    out.push(markerUnderline(x + panelW / 2 - textWidth(panel.title, 14, true) / 2, top + 30, textWidth(panel.title, 14, true), seed));
    return out.join('');
  };

  parts.push(drawPanel(spec.left, pad, C.brand, C.brandSoft, `${spec.id}-l`));
  parts.push(drawPanel(spec.right, pad + panelW + gap, C.ok, C.okSoft, `${spec.id}-r`));

  let height = top + panelH + pad;
  if (spec.verdict) {
    const vy = top + panelH + 16;
    const lines = wrap(spec.verdict, 12, width - pad * 2 - 28);
    const vh = lines.length * 12 * 1.4 + 20;
    parts.push(
      `<rect x="${r(pad)}" y="${r(vy)}" width="${r(width - pad * 2)}" height="${r(vh)}" rx="10" fill="${C.ink}"/>`,
      textBlock(lines, { x: pad + 16, y: vy + 20, size: 12, fill: C.white, anchor: 'start', lineHeight: 1.4 }),
    );
    height = vy + vh + pad;
  }
  height += FOOTER_H;
  parts.push(footer(width, height));

  return svgDoc({ width, height, title: spec.title, desc: spec.alt, body: parts.join('') });
}

/* ----------------------------------------------------------- layout: steps */

export function layoutSteps(spec) {
  const pad = 26;
  const width = spec.width || 760;
  const head = header(spec.title, spec.kicker, width, pad);
  const dot = 30;
  const textX = pad + dot + 18;
  const textW = width - textX - pad - (spec.steps.some((s) => s.note) ? 130 : 0);

  const parts = [head.markup];
  let y = head.nextY + 6;
  const centres = [];

  spec.steps.forEach((step, i) => {
    const labelLines = wrap(step.label, 13.5, textW, true);
    const subLines = step.sub ? wrap(step.sub, 11.5, textW) : [];
    const blockH = labelLines.length * 13.5 * 1.35 + (subLines.length ? subLines.length * 11.5 * 1.4 + 4 : 0);
    const cy = y + Math.max(dot, blockH) / 2;
    centres.push(cy);

    parts.push(
      `<circle cx="${r(pad + dot / 2)}" cy="${r(cy)}" r="${dot / 2}" fill="${C.brand}"/>`,
      textBlock([String(i + 1)], { x: pad + dot / 2, y: cy + 4.5, size: 13, fill: C.white, weight: 700 }),
      textBlock(labelLines, { x: textX, y: y + 13, size: 13.5, fill: C.ink, weight: 600, anchor: 'start', lineHeight: 1.35 }),
    );
    if (subLines.length) {
      parts.push(
        textBlock(subLines, {
          x: textX,
          y: y + 13 + labelLines.length * 13.5 * 1.35 + 4,
          size: 11.5,
          fill: C.muted,
          anchor: 'start',
          lineHeight: 1.4,
        }),
      );
    }
    if (step.note) {
      parts.push(handwrite(step.note, { x: width - pad - 118, y: y + 16, size: 14 }));
    }
    if (step.underline) {
      parts.push(markerUnderline(textX, y + 18, Math.min(textW, textWidth(labelLines[0], 13.5, true)), `${spec.id}-u${i}`));
    }
    y += Math.max(dot, blockH) + 20;
  });

  if (centres.length > 1) {
    parts.splice(
      1,
      0,
      `<line x1="${r(pad + dot / 2)}" y1="${r(centres[0])}" x2="${r(pad + dot / 2)}" y2="${r(centres.at(-1))}" stroke="${C.line}" stroke-width="2"/>`,
    );
  }

  const height = y + 4 + FOOTER_H;
  parts.push(footer(width, height));

  return svgDoc({ width, height, title: spec.title, desc: spec.alt, body: parts.join('') });
}

/* -------------------------------------------------------- layout: triangle */

export function layoutTriangle(spec) {
  const pad = 26;
  const width = spec.width || 720;
  const head = header(spec.title, spec.kicker, width, pad);
  const size = 250;
  const cx = width / 2;
  const top = head.nextY + 34;

  const V = [
    [cx, top],
    [cx + size * 0.92, top + size],
    [cx - size * 0.92, top + size],
  ];

  const parts = [head.markup];
  parts.push(
    `<polygon points="${V.map(([x, y]) => `${r(x)},${r(y)}`).join(' ')}" fill="${C.brandSoft}" fill-opacity="0.55" stroke="${C.brand}" stroke-width="1.8"/>`,
  );

  const pairs = [
    [0, 1],
    [1, 2],
    [2, 0],
  ];
  (spec.edges || []).forEach((edge, i) => {
    const [a, b] = pairs[i];
    const mx = (V[a][0] + V[b][0]) / 2;
    const my = (V[a][1] + V[b][1]) / 2;
    const w = Math.max(textWidth(edge.label, 12.5, true), textWidth(edge.sub || '', 10.5)) + 26;
    const h = edge.sub ? 42 : 26;
    const struck = edge.struck;
    parts.push(
      `<rect x="${r(mx - w / 2)}" y="${r(my - h / 2)}" width="${r(w)}" height="${h}" rx="9" fill="${C.white}" stroke="${struck ? C.warn : C.brand}" stroke-width="1.4"/>`,
      textBlock([edge.label], { x: mx, y: my + (edge.sub ? -2 : 4.5), size: 12.5, fill: C.ink, weight: 700 }),
    );
    if (edge.sub) parts.push(textBlock([edge.sub], { x: mx, y: my + 13, size: 10.5, fill: C.muted }));
    // the "not real" option gets crossed out by hand
    if (struck) {
      parts.push(
        `<path d="${wobbleLine(mx - w / 2 + 6, my + h / 2 - 6, mx + w / 2 - 6, my - h / 2 + 6, `${spec.id}-x`, 1.6)}" stroke="${C.warn}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.85"/>`,
      );
    }
  });

  (spec.vertices || []).forEach((v, i) => {
    const [x, y] = V[i];
    const isTop = i === 0;
    const dy = isTop ? -34 : 30;
    const w = Math.max(textWidth(v.label, 13.5, true), textWidth(v.sub || '', 11)) + 28;
    parts.push(
      `<circle cx="${r(x)}" cy="${r(y)}" r="8" fill="${C.brand}" stroke="${C.paper}" stroke-width="2.5"/>`,
      `<rect x="${r(x - w / 2)}" y="${r(y + dy - (isTop ? 12 : 0))}" width="${r(w)}" height="${v.sub ? 40 : 24}" rx="10" fill="${C.ink}"/>`,
      textBlock([v.label], { x, y: y + dy + (isTop ? 4 : 16), size: 13.5, fill: C.white, weight: 700 }),
    );
    if (v.sub) parts.push(textBlock([v.sub], { x, y: y + dy + (isTop ? 18 : 30), size: 11, fill: C.lavender }));
  });

  if (spec.note) {
    const nx = pad + 4;
    const ny = top + 46;
    parts.push(handwrite(spec.note, { x: nx, y: ny, size: 15 }));
  }

  const height = top + size + 76 + FOOTER_H;
  parts.push(footer(width, height));

  return svgDoc({ width, height, title: spec.title, desc: spec.alt, body: parts.join('') });
}

export const LAYOUTS = {
  flow: layoutFlow,
  ring: layoutRing,
  compare: layoutCompare,
  steps: layoutSteps,
  triangle: layoutTriangle,
};

export function render(spec) {
  const fn = LAYOUTS[spec.type];
  if (!fn) throw new Error(`Unknown diagram type: ${spec.type}`);
  return fn(spec);
}
