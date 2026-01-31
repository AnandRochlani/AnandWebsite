import { ensureSchemaAndSeed, toCourseDto } from '../_db.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const sql = await ensureSchemaAndSeed();

    const id = req?.query?.id;
    if (id) {
      const rows = await sql`SELECT * FROM courses WHERE id = ${Number(id)} LIMIT 1;`;
      const course = toCourseDto(rows?.[0] || null);
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }
      res.status(200).json({ course });
      return;
    }

    const rows = await sql`SELECT * FROM courses ORDER BY featured DESC, id ASC;`;
    res.status(200).json({ courses: rows.map(toCourseDto) });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Server error' });
  }
}

