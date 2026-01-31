import { ensureSchemaAndSeed, toBlogPostDto } from '../_db.js';
import { requireAdmin } from './_requireAdmin.js';

export default async function handler(req, res) {
  const user = await requireAdmin(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const sql = await ensureSchemaAndSeed();
    const id = req?.query?.id ? Number(req.query.id) : null;

    if (req.method === 'POST') {
      const body = req.body || {};

      const rows = await sql`
        INSERT INTO blog_posts (
          slug,
          title,
          description,
          content,
          author,
          date,
          category,
          read_time,
          featured_image,
          featured,
          series,
          series_order,
          updated_at
        )
        VALUES (
          ${body.slug || null},
          ${body.title},
          ${body.description || null},
          ${body.content || null},
          ${body.author || null},
          ${body.date || null},
          ${body.category || null},
          ${body.readTime || null},
          ${body.featuredImage || null},
          ${Boolean(body.featured)},
          ${body.series || null},
          ${typeof body.order === 'number' ? body.order : Number(body.order) || null},
          NOW()
        )
        RETURNING *;
      `;

      res.status(200).json({ success: true, post: toBlogPostDto(rows?.[0] || null) });
      return;
    }

    if (req.method === 'PUT') {
      if (!id) {
        res.status(400).json({ error: 'Missing id' });
        return;
      }

      const body = req.body || {};

      const rows = await sql`
        UPDATE blog_posts
        SET
          slug = ${body.slug || null},
          title = ${body.title},
          description = ${body.description || null},
          content = ${body.content || null},
          author = ${body.author || null},
          date = ${body.date || null},
          category = ${body.category || null},
          read_time = ${body.readTime || null},
          featured_image = ${body.featuredImage || null},
          featured = ${Boolean(body.featured)},
          series = ${body.series || null},
          series_order = ${typeof body.order === 'number' ? body.order : Number(body.order) || null},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;

      const post = toBlogPostDto(rows?.[0] || null);
      if (!post) {
        res.status(404).json({ error: 'Blog post not found' });
        return;
      }

      res.status(200).json({ success: true, post });
      return;
    }

    if (req.method === 'DELETE') {
      if (!id) {
        res.status(400).json({ error: 'Missing id' });
        return;
      }

      await sql`DELETE FROM blog_posts WHERE id = ${id};`;
      res.status(200).json({ success: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Server error' });
  }
}

