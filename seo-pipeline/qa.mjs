#!/usr/bin/env node
/**
 * QA gate for article drafts. Checks every draft in seo-pipeline/articles/
 * (or the files passed as arguments) against ARTICLE_SPEC.md.
 *
 *   node seo-pipeline/qa.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const articlesDir = path.join(here, 'articles');
const plan = JSON.parse(fs.readFileSync(path.join(here, 'content-plan.json'), 'utf8'));

const UDEMY_RE = /https:\/\/www\.udemy\.com\/course\/system-design-fundamental\/\?referralCode=4D123B9F202E6D906A73/g;
const REQUIRED = ['slug', 'title', 'description', 'content', 'author', 'category', 'readTime', 'featuredImage', 'series', 'order'];

function knownSlugs() {
  const slugs = new Set(plan.queue.map((q) => q.slug));
  try {
    const live = JSON.parse(
      fs.readFileSync(path.join(here, 'reference', 'live_posts_2026-07-31.json'), 'utf8')
    );
    for (const p of live.posts || []) slugs.add(p.slug);
  } catch {
    /* reference snapshot optional */
  }
  return slugs;
}

export async function runQa(files) {
  const targets =
    files && files.length
      ? files
      : fs
          .readdirSync(articlesDir)
          .filter((f) => f.endsWith('.json'))
          .sort()
          .map((f) => path.join(articlesDir, f));

  const slugs = knownSlugs();
  const seenSlugs = new Set();
  const seenOrders = new Set();
  let ok = true;
  let fileFailed = false;
  const fail = (file, msg) => {
    ok = false;
    fileFailed = true;
    console.error(`  FAIL ${path.basename(file)}: ${msg}`);
  };

  for (const file of targets) {
    fileFailed = false;
    let d;
    try {
      d = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      fail(file, `invalid JSON (${e.message})`);
      continue;
    }

    for (const f of REQUIRED) if (d[f] === undefined || d[f] === null || d[f] === '') fail(file, `missing field "${f}"`);
    if (!d.content) continue;

    if (seenSlugs.has(d.slug)) fail(file, `duplicate slug ${d.slug}`);
    if (seenOrders.has(d.order)) fail(file, `duplicate order ${d.order}`);
    seenSlugs.add(d.slug);
    seenOrders.add(d.order);

    if (!/^[a-z0-9-]+$/.test(d.slug)) fail(file, `slug has invalid characters: ${d.slug}`);
    if (d.description.length < 120 || d.description.length > 170)
      fail(file, `description is ${d.description.length} chars (want 120-170)`);
    if (/<h1[\s>]/i.test(d.content)) fail(file, 'content contains <h1> (title is rendered as h1 by the page)');

    const words = d.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    if (words < 1200) fail(file, `content is ${words} words (want 1300-1900)`);
    if (words > 2200) fail(file, `content is ${words} words (want 1300-1900)`);

    const ctas = d.content.match(UDEMY_RE) || [];
    if (ctas.length !== 1) fail(file, `${ctas.length} Udemy CTA links (want exactly 1)`);

    const internal = [...d.content.matchAll(/href="\/blog\/([a-z0-9-]+)"/g)].map((m) => m[1]);
    if (internal.length < 2) fail(file, `${internal.length} internal /blog/ links (want 2-4)`);
    for (const s of internal) if (!slugs.has(s)) fail(file, `internal link to unknown slug: ${s}`);

    if (!/^\d+ min read$/.test(d.readTime)) fail(file, `readTime format: ${d.readTime}`);
    if (plan.imagePool && !plan.imagePool.includes(d.featuredImage))
      fail(file, `featuredImage not in verified imagePool`);
    if (d.category !== 'System Design') fail(file, `category "${d.category}" (want "System Design")`);
    if (d.series !== plan.series) fail(file, `series "${d.series}" (want "${plan.series}")`);

    if (!fileFailed) console.log(`  ok   ${path.basename(file)} (${words} words, ${internal.length} internal links)`);
  }

  return { ok };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { ok } = await runQa(process.argv.slice(2));
  if (!ok) process.exit(1);
  console.log('QA passed.');
}
