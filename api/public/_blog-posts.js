import { ensureSchemaAndSeed, toBlogPostDto } from '../_db.js';
import { blogPosts as staticBlogPosts } from '../../src/data/blogPosts.js';

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

      const post = toBlogPostDto(rows?.[0] || null);
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
        CASE WHEN category = 'System Design' THEN 0 ELSE 1 END,
        CASE WHEN series_order IS NULL THEN 999 ELSE series_order END,
        date DESC NULLS LAST,
        id DESC;
    `;

    res.status(200).json({ posts: rows.map(toBlogPostDto) });
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

