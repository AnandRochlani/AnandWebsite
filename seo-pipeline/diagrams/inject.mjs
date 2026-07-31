#!/usr/bin/env node
/**
 * Insert each article's diagram into its live blog post.
 *
 *   node seo-pipeline/diagrams/inject.mjs                                  # dry run, shows the plan
 *   ADMIN_USERNAME=... ADMIN_PASSWORD=... node .../inject.mjs --yes         # write to the live blog
 *   node seo-pipeline/diagrams/inject.mjs --slug consistent-hashing-...     # limit to one post
 *
 * Idempotent: a post that already contains its diagram id is skipped, so this can be
 * re-run safely after regenerating SVGs. Only the <figure> block is added — the rest of
 * the article content is passed through untouched.
 *
 * Placement: immediately before the SECOND <h2>, i.e. after the opening section. That
 * puts the diagram high enough to be seen without pushing the primary keyword out of
 * the first screen. Override per spec with `after: '<heading substring>'`.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPECS, BY_SLUG } from './specs.mjs';
import { esc } from './lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SITE = (process.env.SITE_URL || 'https://anandrochlani.com').replace(/\/$/, '');
const USER = process.env.ADMIN_USERNAME;
const PASS = process.env.ADMIN_PASSWORD;

const argv = process.argv.slice(2);
const YES = argv.includes('--yes');
const slugFilter = argv.includes('--slug') ? argv[argv.indexOf('--slug') + 1] : null;

/** The markup inserted into the article body. */
export function figureHtml(spec) {
  return (
    `<figure class="article-diagram">` +
    `<img src="/diagrams/${spec.id}.svg" alt="${esc(spec.alt)}" loading="lazy" decoding="async">` +
    `<figcaption>${esc(spec.caption)}</figcaption>` +
    `</figure>`
  );
}

/** Returns the content with the figure inserted, or null if it is already present. */
export function insertFigure(content, spec) {
  const html = String(content || '');
  if (html.includes(`/diagrams/${spec.id}.svg`)) return null;

  const figure = figureHtml(spec);

  if (spec.after) {
    // Insert after the named heading's section: at the next <h2> following it.
    const idx = html.indexOf(spec.after);
    if (idx !== -1) {
      const next = html.indexOf('<h2', idx + spec.after.length);
      if (next !== -1) return html.slice(0, next) + figure + html.slice(next);
    }
  }

  const headings = [...html.matchAll(/<h2[\s>]/gi)].map((m) => m.index);
  if (headings.length >= 2) return html.slice(0, headings[1]) + figure + html.slice(headings[1]);

  // Fall back to appending after the first paragraph rather than skipping the post.
  const firstClose = html.indexOf('</p>');
  if (firstClose !== -1) return html.slice(0, firstClose + 4) + figure + html.slice(firstClose + 4);
  return figure + html;
}

async function api(pathname, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${SITE}${pathname}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON error body */
  }
  return { res, json, text };
}

async function login() {
  if (!USER || !PASS) {
    console.error('Missing ADMIN_USERNAME / ADMIN_PASSWORD env vars (same values as Vercel).');
    process.exit(1);
  }
  const { res, json } = await api('/api/admin/login', {
    method: 'POST',
    body: { username: USER, password: PASS },
  });
  if (!res.ok) {
    console.error(`Login failed (${res.status}):`, json?.error || '');
    process.exit(1);
  }
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    console.error('Login succeeded but no session cookie was returned.');
    process.exit(1);
  }
  return setCookie.split(';')[0];
}

async function main() {
  const { res, json } = await api('/api/public/blog-posts');
  if (!res.ok) {
    console.error(`Could not fetch live posts (${res.status}).`);
    process.exit(1);
  }
  const posts = json.posts || [];

  const plan = [];
  const missing = [];

  for (const post of posts) {
    const spec = BY_SLUG.get(post.slug);
    if (!spec) continue;
    if (slugFilter && post.slug !== slugFilter) continue;
    const updated = insertFigure(post.content, spec);
    if (updated === null) {
      plan.push({ post, spec, status: 'already-present' });
    } else {
      plan.push({ post, spec, status: 'insert', content: updated });
    }
  }

  const covered = new Set(plan.map((p) => p.post.slug));
  for (const spec of SPECS) if (!covered.has(spec.slug) && !slugFilter) missing.push(spec.slug);

  console.log(`\nDiagram injection plan → ${SITE}`);
  for (const item of plan) {
    console.log(`  ${item.status === 'insert' ? 'INSERT ' : 'skip   '} ${item.spec.id.padEnd(36)} → ${item.post.slug}`);
  }
  if (missing.length) {
    console.log(`\n  ${missing.length} spec(s) have no matching live post:`);
    for (const slug of missing) console.log(`    - ${slug}`);
  }

  const toWrite = plan.filter((p) => p.status === 'insert');
  console.log(`\n${toWrite.length} post(s) to update, ${plan.length - toWrite.length} already done.`);

  mkdirSync(resolve(ROOT, 'seo-pipeline/reports'), { recursive: true });
  writeFileSync(
    resolve(ROOT, 'seo-pipeline/reports/diagram-injection.json'),
    JSON.stringify(
      {
        site: SITE,
        planned: toWrite.map((p) => ({ slug: p.post.slug, id: p.post.id, diagram: p.spec.id })),
        alreadyPresent: plan.filter((p) => p.status !== 'insert').map((p) => p.post.slug),
        specsWithoutPost: missing,
      },
      null,
      2,
    ),
  );

  if (!YES) {
    console.log('Dry run. Re-run with --yes (and admin credentials) to write.');
    return;
  }
  if (!toWrite.length) return;

  const cookie = await login();
  let failures = 0;
  for (const item of toWrite) {
    const body = { ...item.post, content: item.content };
    const { res: r, json: j } = await api(`/api/admin/blog-posts?id=${item.post.id}`, {
      method: 'PUT',
      body,
      cookie,
    });
    if (r.ok && j?.success) {
      console.log(`  OK   ${item.post.slug}`);
    } else {
      failures++;
      console.error(`  FAIL ${item.post.slug} (${r.status}): ${j?.error || ''}`);
    }
  }

  if (failures) {
    console.error(`\n${failures} post(s) failed to update.`);
    process.exit(1);
  }
  console.log('\nDone. Rebuild so the prerendered HTML picks up the figures: npm run build');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
