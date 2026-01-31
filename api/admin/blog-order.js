import { ensureSchemaAndSeed } from '../_db.js';
import { requireAdmin } from './_requireAdmin.js';

export default async function handler(req, res) {
  const user = await requireAdmin(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const sql = await ensureSchemaAndSeed();
    const list = Array.isArray(req.body) ? req.body : req.body?.blogOrderList;

    if (!Array.isArray(list)) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    for (const item of list) {
      if (!item?.id) continue;
      const order = typeof item.order === 'number' ? item.order : Number(item.order);
      await sql`
        UPDATE blog_posts
        SET series_order = ${Number.isFinite(order) ? order : null}, updated_at = NOW()
        WHERE id = ${Number(item.id)};
      `;
    }

    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Server error' });
  }
}

