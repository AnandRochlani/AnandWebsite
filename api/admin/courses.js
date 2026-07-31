import { ensureSchemaAndSeed, toCourseDto } from '../_db.js';
import { requireAdmin } from './_requireAdmin.js';
import { slugify } from '../../src/lib/slug.js';

// Compute a slug from the admin-provided body. Prefer an explicit slug, then
// auto-derive from the name. We resolve collisions against other courses by
// suffixing the colliding row's id (or appending a counter on POST where we
// don't yet know the id).
async function resolveSlug(sql, { id, requestedSlug, name }) {
  const candidate =
    (requestedSlug && slugify(requestedSlug)) || slugify(name) || '';
  if (!candidate) return null;

  // If we're updating a row, allow the existing slug to stay the same.
  const collisions = id
    ? await sql`SELECT id FROM courses WHERE slug = ${candidate} AND id <> ${id} LIMIT 1;`
    : await sql`SELECT id FROM courses WHERE slug = ${candidate} LIMIT 1;`;

  if (!collisions || collisions.length === 0) return candidate;

  // Collision: try `${candidate}-2`, `-3`, ... up to a reasonable cap.
  for (let i = 2; i <= 50; i++) {
    const suffixed = `${candidate}-${i}`;
    const hit = id
      ? await sql`SELECT id FROM courses WHERE slug = ${suffixed} AND id <> ${id} LIMIT 1;`
      : await sql`SELECT id FROM courses WHERE slug = ${suffixed} LIMIT 1;`;
    if (!hit || hit.length === 0) return suffixed;
  }

  // Extreme fallback: timestamp suffix.
  return `${candidate}-${Date.now()}`;
}

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
      const slug = await resolveSlug(sql, {
        id: null,
        requestedSlug: body.slug,
        name: body.name,
      });

      const rows = await sql`
        INSERT INTO courses (
          name,
          slug,
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
          ${slug},
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
      const slug = await resolveSlug(sql, {
        id,
        requestedSlug: body.slug,
        name: body.name,
      });

      const rows = await sql`
        UPDATE courses
        SET
          name = ${body.name},
          slug = ${slug},
          description = ${body.description || null},
          instructor = ${body.instructor || null},
          instructor_bio = ${body.instructorBio || null},
          level = ${body.level || null},
          duration = ${body.duration || null},
          price = ${body.price || null},
          category = ${body.category || null},
          rating = ${typeof body.rating === 'number' ? body.rating : Number(body.rating) || null},
          students_enrolled = ${body.studentsEnrolled !== undefined && body.studentsEnrolled !== null ? String(body.studentsEnrolled) : null},
          featured_image = ${body.featuredImage || null},
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
