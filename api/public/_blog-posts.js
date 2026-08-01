import { ensureSchemaAndSeed, toBlogPostDto } from '../_db.js';
import { blogPosts as staticBlogPosts } from '../../src/data/blogPosts.js';
import { comparePosts, isIndexablePost } from '../../src/lib/contentTaxonomy.js';

/**
 * Merge the bundled corpus with the database rows, database winning per slug.
 *
 * Articles ship as prerendered pages straight from seo-pipeline/articles/*.json on
 * deploy, but they only reach Neon when publish.mjs is run with admin credentials.
 * Without this merge a freshly deployed article is live and in the sitemap yet
 * missing from /blog, from its own series sidebar, and from in-app navigation.
 */
export function mergePosts(dbPosts) {
  const merged = new Map();
  // Only cluster content is contributed from the bundle. The legacy template posts
  // live in the bundle too, and merging those would resurrect the eight off-topic
  // posts every time cleanup-offtopic.mjs deletes them from the database.
  for (const p of staticBlogPosts) if (p.slug && isIndexablePost(p)) merged.set(p.slug, p);
  for (const p of dbPosts || []) {
    if (!p.slug) continue;
    // Admin edits win field by field, so a bundled draft that has not been
    // published yet still contributes the fields the database has no row for.
    merged.set(p.slug, merged.has(p.slug) ? { ...merged.get(p.slug), ...p } : p);
  }
  return [...merged.values()].sort(comparePosts);
}

function sanitizeErrorMessage(message) {
  if (!message) return 'Server error';
  // Avoid leaking credentials if a URL shows up in error text
  return String(message).replace(/postgres(ql)?:\/\/[^@\s]+@/gi, 'postgres://***@');
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const sql = await ensureSchemaAndSeed();

    const slug = req?.query?.slug;
    const id = req?.query?.id;

    if (slug || id) {
      let rows = [];
      if (slug) {
        rows = await sql`SELECT * FROM blog_posts WHERE slug = ${String(slug)} LIMIT 1;`;
      } else if (id) {
        rows = await sql`SELECT * FROM blog_posts WHERE id = ${Number(id)} LIMIT 1;`;
      }

      const dbPost = toBlogPostDto(rows?.[0] || null);
      const bundled = slug
        ? staticBlogPosts.find((p) => p.slug === String(slug))
        : staticBlogPosts.find((p) => Number(p.id) === Number(id));
      const post = dbPost && bundled ? { ...bundled, ...dbPost } : dbPost || bundled || null;
      if (!post) {
        res.status(404).json({ error: 'Blog post not found' });
        return;
      }

      res.status(200).json({ post });
      return;
    }

    const rows = await sql`
      SELECT *
      FROM blog_posts
      ORDER BY
        CASE category
          WHEN 'System Design' THEN 0
          WHEN 'Coding Interview' THEN 1
          ELSE 2
        END,
        CASE WHEN series_order IS NULL THEN 999 ELSE series_order END,
        date DESC NULLS LAST,
        id DESC;
    `;

    res.status(200).json({ posts: mergePosts(rows.map(toBlogPostDto)) });
  } catch (e) {
    // Fallback to static content if DB isn't configured yet (prevents site outage).
    try {
      const slug = req?.query?.slug;
      const id = req?.query?.id;

      if (slug || id) {
        const value = slug ? String(slug) : String(id);
        const isNumeric = !slug && /^[0-9]+$/.test(value);
        const post = isNumeric
          ? staticBlogPosts.find((p) => Number(p.id) === Number(value))
          : staticBlogPosts.find((p) => p.slug === value);

        if (!post) {
          res.status(404).json({ error: 'Blog post not found' });
          return;
        }

        res.status(200).json({ post, warning: sanitizeErrorMessage(e?.message) });
        return;
      }

      res.status(200).json({ posts: staticBlogPosts, warning: sanitizeErrorMessage(e?.message) });
    } catch (e2) {
      res.status(500).json({ error: sanitizeErrorMessage(e?.message) });
    }
  }
}

