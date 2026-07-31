#!/usr/bin/env node
/**
 * Render every diagram spec to public/diagrams/<id>.svg.
 *
 *   node seo-pipeline/diagrams/generate.mjs            # write SVGs + preview page
 *   node seo-pipeline/diagrams/generate.mjs --check    # verify files are current, write nothing
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, esc } from './lib.mjs';
import { SPECS } from './specs.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT_DIR = resolve(ROOT, 'public/diagrams');
const PREVIEW = resolve(ROOT, 'seo-pipeline/reports/diagrams-preview.html');

const check = process.argv.includes('--check');

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(dirname(PREVIEW), { recursive: true });

const seen = new Set();
let written = 0;
let stale = 0;

for (const spec of SPECS) {
  if (seen.has(spec.id)) throw new Error(`Duplicate diagram id: ${spec.id}`);
  seen.add(spec.id);
  if (!spec.alt || spec.alt.length < 60) {
    throw new Error(`${spec.id}: alt text missing or too short to be useful`);
  }

  const svg = render(spec);
  const file = resolve(OUT_DIR, `${spec.id}.svg`);
  const current = existsSync(file) ? readFileSync(file, 'utf8') : null;

  if (current === svg) continue;
  if (check) {
    stale++;
    console.error(`stale: public/diagrams/${spec.id}.svg`);
    continue;
  }
  writeFileSync(file, svg);
  written++;
}

if (check) {
  console.log(stale ? `${stale} diagram(s) out of date — run without --check` : 'All diagrams current.');
  process.exit(stale ? 1 : 0);
}

// Contact sheet for visual review.
const preview = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Diagram preview</title>
<style>
  body{margin:0;padding:32px;background:#F4F4FB;font:14px/1.5 Inter,system-ui,sans-serif;color:#0D0B33}
  h1{font-size:20px;margin:0 0 4px}
  p.lede{color:#5B5885;margin:0 0 28px}
  figure{background:#fff;border:1px solid #E3E2F5;border-radius:14px;padding:18px;margin:0 0 22px;max-width:960px}
  figure img{display:block;max-width:100%;height:auto;margin:0 auto}
  figcaption{color:#5B5885;font-size:12.5px;margin-top:12px;border-top:1px solid #EEEEFF;padding-top:10px}
  code{background:#EEEEFF;color:#4341D6;border-radius:4px;padding:1px 5px;font-size:12px}
</style></head><body>
<h1>System Design article diagrams</h1>
<p class="lede">${SPECS.length} diagrams · rendered from <code>seo-pipeline/diagrams/specs.mjs</code></p>
${SPECS.map(
  (s) => `<figure>
  <img src="/diagrams/${s.id}.svg" alt="${esc(s.alt)}" loading="lazy">
  <figcaption><code>${esc(s.id)}</code> · ${esc(s.type)} → <code>/blog/${esc(s.slug)}</code><br>${esc(s.caption)}</figcaption>
</figure>`,
).join('\n')}
</body></html>`;

writeFileSync(PREVIEW, preview);
console.log(`Rendered ${written} diagram(s) into public/diagrams/ (${SPECS.length} total).`);
console.log(`Preview: seo-pipeline/reports/diagrams-preview.html`);
