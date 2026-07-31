#!/usr/bin/env node
/**
 * Delete the off-topic template posts that dilute the System Design cluster.
 *
 *   node seo-pipeline/cleanup-offtopic.mjs                                # dry run
 *   ADMIN_USERNAME=... ADMIN_PASSWORD=... node .../cleanup-offtopic.mjs --yes
 *
 * These 8 posts (React, CSS Grid, ML, Node, UX, D3, responsive design, TypeScript) are
 * already out of the blog index and 404 at their routes, but they still exist in the
 * database and are still returned by the public API. Deleting them finishes the job.
 *
 * Safety (see also the isIndexableCategory guard below):
 *  - matches by SLUG, never by id, so a re-ordered table cannot delete the wrong row;
 *  - refuses to touch anything in the System Design category or series;
 *  - writes a JSON backup of every post it deletes to seo-pipeline/reports/ first, so
 *    the content can be restored with publish.mjs if this turns out to be wrong.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INDEXABLE_SERIES, isIndexableCategory } from '../src/lib/contentTaxonomy.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.env.SITE_URL || 'https://anandrochlani.com').replace(/\/$/, '');
const USER = process.env.ADMIN_USERNAME;
const PASS = process.env.ADMIN_PASSWORD;
const YES = process.argv.includes('--yes');

/** Explicit allow-list. Nothing is deleted that is not named here. */
const OFF_TOPIC_SLUGS = [
  'getting-started-with-react-hooks-learn-how-to-use-usestate-useeffect-and-custom-hooks-in-functional-components',
  'mastering-css-grid-layout',
  'introduction-to-machine-learning',
  'building-restful-apis-with-node-js',
  'ux-design-principles-for-beginners',
  'data-visualization-with-d3-js',
  'responsive-web-design-best-practices',
  'introduction-to-typescript',
];

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
  return { res, json };
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

const { res, json } = await api('/api/public/blog-posts');
if (!res.ok) {
  console.error(`Could not fetch live posts (${res.status}).`);
  process.exit(1);
}
const posts = json.posts || [];

const targets = posts.filter((p) => OFF_TOPIC_SLUGS.includes(p.slug));
const guarded = targets.filter(
  (p) => isIndexableCategory(p.category) || INDEXABLE_SERIES.includes(p.series),
);

if (guarded.length) {
  console.error('Refusing to run: these slugs are now indexable cluster content:');
  for (const p of guarded) console.error(`  - ${p.slug}`);
  process.exit(1);
}

const notFound = OFF_TOPIC_SLUGS.filter((s) => !targets.some((p) => p.slug === s));

console.log(`\nOff-topic cleanup plan → ${SITE}`);
for (const p of targets) {
  const words = String(p.content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  console.log(`  DELETE  id ${String(p.id).padEnd(4)} ${String(p.category || '—').padEnd(18)} ${words.toString().padStart(4)}w  ${p.slug}`);
}
if (notFound.length) {
  console.log(`\n  ${notFound.length} already gone: ${notFound.join(', ')}`);
}
console.log(`\n${targets.length} post(s) to delete. Remaining after cleanup: ${posts.length - targets.length}.`);

if (!targets.length) process.exit(0);

mkdirSync(resolve(ROOT, 'seo-pipeline/reports'), { recursive: true });
const backup = resolve(ROOT, 'seo-pipeline/reports/deleted-offtopic-backup.json');
writeFileSync(backup, JSON.stringify(targets, null, 2));
console.log(`Backup of full post content written to ${backup.replace(ROOT + '/', '')}`);

if (!YES) {
  console.log('Dry run. Re-run with --yes (and admin credentials) to delete.');
  process.exit(0);
}

const cookie = await login();
let failures = 0;
for (const p of targets) {
  const { res: r, json: j } = await api(`/api/admin/blog-posts?id=${p.id}`, { method: 'DELETE', cookie });
  if (r.ok && j?.success) console.log(`  OK   deleted ${p.slug}`);
  else {
    failures++;
    console.error(`  FAIL ${p.slug} (${r.status}): ${j?.error || ''}`);
  }
}

if (failures) {
  console.error(`\n${failures} post(s) failed to delete.`);
  process.exit(1);
}
console.log('\nDone. Now run: npm run seo:sitemap && npm run build');
