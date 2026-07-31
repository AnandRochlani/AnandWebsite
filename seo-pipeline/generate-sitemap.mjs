#!/usr/bin/env node
/**
 * Regenerate public/sitemap.xml from the LIVE site content (blog posts + courses).
 * Run after every publish, then commit the result so the next deploy ships it.
 *
 *   node seo-pipeline/generate-sitemap.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify } from '../src/lib/slug.js';

const SITE = (process.env.SITE_URL || 'https://anandrochlani.com').replace(/\/$/, '');
const CANONICAL = 'https://anandrochlani.com'; // apex only — www is not attached in Vercel
const here = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(here, '..', 'public', 'sitemap.xml');

function iso(d) {
  const date = d ? new Date(d) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

function url(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function main() {
  const [postsRes, coursesRes] = await Promise.all([
    fetch(`${SITE}/api/public/blog-posts`),
    fetch(`${SITE}/api/public/courses`),
  ]);
  if (!postsRes.ok || !coursesRes.ok) {
    throw new Error(`API fetch failed: posts ${postsRes.status}, courses ${coursesRes.status}`);
  }
  const posts = (await postsRes.json()).posts || [];
  const courses = (await coursesRes.json()).courses || [];

  const today = iso();
  const entries = [
    url(`${CANONICAL}/`, today, 'weekly', '1.0'),
    url(`${CANONICAL}/courses`, today, 'weekly', '0.9'),
    url(`${CANONICAL}/blog`, today, 'daily', '0.9'),
    url(`${CANONICAL}/jobs`, today, 'daily', '0.5'),
  ];

  for (const c of courses) {
    // External (Udemy) courses still have an internal detail page worth indexing.
    // Use the slug form — that is what CoursesPage links to and what the prerendered
    // page canonicalises to, so the sitemap must not advertise the numeric variant.
    const slug = c.slug || slugify(c.name || c.title || String(c.id));
    entries.push(url(`${CANONICAL}/courses/${slug}`, iso(c.updatedAt || c.updated_at), 'monthly', '0.7'));
  }

  for (const p of posts) {
    if (!p.slug) continue;
    const priority = p.category === 'System Design' ? '0.8' : '0.6';
    entries.push(url(`${CANONICAL}/blog/${p.slug}`, iso(p.updatedAt || p.updated_at || p.date), 'monthly', priority));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  fs.writeFileSync(outPath, xml, 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), outPath)}: ${entries.length} URLs (${posts.length} posts, ${courses.length} courses).`);
  console.log('Commit + push so the deploy serves the updated sitemap, then (optionally) ping Google Search Console.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
