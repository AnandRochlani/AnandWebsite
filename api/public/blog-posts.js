import { ensureSchemaAndSeed, toBlogPostDto } from '../_db.js';

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
    res.status(500).json({ error: e?.message || 'Server error' });
  }
}

