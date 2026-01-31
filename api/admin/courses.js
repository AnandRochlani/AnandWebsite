import { ensureSchemaAndSeed, toCourseDto } from '../_db.js';
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
      const modules = body.modules ? JSON.stringify(body.modules) : null;
      const learning = body.learningOutcomes ? JSON.stringify(body.learningOutcomes) : null;

      const rows = await sql`
        INSERT INTO courses (
          name,
          description,
          instructor,
          instructor_bio,
          level,
          duration,
          price,
          category,
          rating,
          students_enrolled,
          featured_image,
          featured,
          is_external,
          external_url,
          modules,
          learning_outcomes,
          updated_at
        )
        VALUES (
          ${body.name},
          ${body.description || null},
          ${body.instructor || null},
          ${body.instructorBio || null},
          ${body.level || null},
          ${body.duration || null},
          ${body.price || null},
          ${body.category || null},
          ${typeof body.rating === 'number' ? body.rating : Number(body.rating) || null},
          ${body.studentsEnrolled !== undefined && body.studentsEnrolled !== null ? String(body.studentsEnrolled) : null},
          ${body.featuredImage || null},
          ${Boolean(body.featured)},
          ${Boolean(body.isExternal)},
          ${body.externalUrl || null},
          ${modules},
          ${learning},
          NOW()
        )
        RETURNING *;
      `;

      res.status(200).json({ success: true, course: toCourseDto(rows?.[0] || null) });
      return;
    }

    if (req.method === 'PUT') {
      if (!id) {
        res.status(400).json({ error: 'Missing id' });
        return;
      }

      const body = req.body || {};
      const modules = body.modules ? JSON.stringify(body.modules) : null;
      const learning = body.learningOutcomes ? JSON.stringify(body.learningOutcomes) : null;

      const rows = await sql`
        UPDATE courses
        SET
          name = ${body.name},
          description = ${body.description || null},
          instructor = ${body.instructor || null},
          instructor_bio = ${body.instructorBio || null},
          level = ${body.level || null},
          duration = ${body.duration || null},
          price = ${body.price || null},
          category = ${body.category || null},
          rating = ${typeof body.rating === 'number' ? body.rating : Number(body.rating) || null},
          students_enrolled = ${body.studentsEnrolled !== undefined && body.studentsEnrolled !== null ? String(body.studentsEnrolled) : null},
          featured = ${Boolean(body.featured)},
          is_external = ${Boolean(body.isExternal)},
          external_url = ${body.externalUrl || null},
          modules = ${modules},
          learning_outcomes = ${learning},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;

      const course = toCourseDto(rows?.[0] || null);
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      res.status(200).json({ success: true, course });
      return;
    }

    if (req.method === 'DELETE') {
      if (!id) {
        res.status(400).json({ error: 'Missing id' });
        return;
      }

      await sql`DELETE FROM courses WHERE id = ${id};`;
      res.status(200).json({ success: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Server error' });
  }
}

