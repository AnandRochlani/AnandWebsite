import { ensureSchemaAndSeed, toCourseDto } from '../_db.js';
import { defaultCourses as staticCourses } from '../../src/data/courses.js';

function sanitizeErrorMessage(message) {
  if (!message) return 'Server error';
  return String(message).replace(/postgres(ql)?:\/\/[^@\s]+@/gi, 'postgres://***@');
}

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
    // Fallback to static content if DB isn't configured yet (prevents site outage).
    try {
      const id = req?.query?.id;
      if (id) {
        const course = staticCourses.find((c) => Number(c.id) === Number(id)) || null;
        if (!course) {
          res.status(404).json({ error: 'Course not found' });
          return;
        }
        res.status(200).json({ course, warning: sanitizeErrorMessage(e?.message) });
        return;
      }
      res.status(200).json({ courses: staticCourses, warning: sanitizeErrorMessage(e?.message) });
    } catch (e2) {
      res.status(500).json({ error: sanitizeErrorMessage(e?.message) });
    }
  }
}

