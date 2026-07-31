/**
 * Loads the universe of blog posts: local drafts (seo-pipeline/articles/*.json)
 * merged with published posts (reference snapshot, optionally refreshed from the
 * live API), deduped by slug. Drafts win — they are the newer copy.
 */
import fs from 'node:fs';
import path from 'node:path';

import {
  INDEXABLE_SERIES,
  isIndexableCategory,
} from '../../src/lib/contentTaxonomy.js';

export const CANONICAL_HOST = 'https://anandrochlani.com';
export const SERIES = 'System Design Tutorial';

/** Posts we are willing to link TO (template placeholders are excluded). */
function isLinkable(post) {
  return INDEXABLE_SERIES.includes(post.series) || isIndexableCategory(post.category);
}

export function blogUrl(slug) {
  return `/blog/${slug}`;
}

export function loadDrafts(articlesDir) {
  if (!fs.existsSync(articlesDir)) return [];
  return fs
    .readdirSync(articlesDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => {
      const file = path.join(articlesDir, f);
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      return { ...data, __source: 'draft', __file: file };
    });
}

export function loadSnapshot(referenceDir) {
  if (!fs.existsSync(referenceDir)) return [];
  const files = fs
    .readdirSync(referenceDir)
    .filter((f) => /^live_posts_.*\.json$/.test(f))
    .sort();
  if (!files.length) return [];
  const latest = path.join(referenceDir, files[files.length - 1]);
  const data = JSON.parse(fs.readFileSync(latest, 'utf8'));
  return (data.posts || []).map((p) => ({ ...p, __source: 'live', __file: latest }));
}

export async function fetchLive(timeoutMs = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${CANONICAL_HOST}/api/public/blog-posts`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.posts || []).map((p) => ({ ...p, __source: 'live', __file: 'api' }));
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Merge sources into one slug-keyed universe.
 * Later sources do NOT overwrite drafts; live posts only fill gaps.
 */
export function mergePosts({ drafts = [], live = [] } = {}) {
  const bySlug = new Map();
  for (const p of live) bySlug.set(p.slug, normalise(p));
  for (const p of drafts) {
    const prev = bySlug.get(p.slug);
    bySlug.set(p.slug, normalise({ ...p, id: p.id ?? prev?.id }));
  }
  const posts = [...bySlug.values()];
  posts.sort((a, b) => {
    const ao = a.order ?? 9999;
    const bo = b.order ?? 9999;
    if (ao !== bo) return ao - bo;
    return a.slug.localeCompare(b.slug);
  });
  return posts;
}

function normalise(p) {
  return {
    slug: p.slug,
    title: p.title || '',
    description: p.description || '',
    content: p.content || '',
    category: p.category || null,
    series: p.series || null,
    order: typeof p.order === 'number' ? p.order : null,
    id: p.id ?? null,
    source: p.__source,
    file: p.__file,
    editable: p.__source === 'draft',
    linkable: isLinkable(p),
    url: blogUrl(p.slug),
  };
}

export function loadPlan(planFile) {
  const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
  const bySlug = new Map();
  for (const q of plan.queue || []) bySlug.set(q.slug, q);
  return { plan, bySlug };
}
