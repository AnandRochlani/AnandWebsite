import { ensureSchemaAndSeed, toCourseDto } from '../_db.js';
import { defaultCourses as staticCourses } from '../../src/data/courses.js';
import { slugify } from '../../src/lib/slug.js';

function sanitizeErrorMessage(message) {
  if (!message) return 'Server error';
  return String(message).replace(/postgres(ql)?:\/\/[^@\s]+@/gi, 'postgres://***@');
}

// Find a course in the bundled defaults by slug or numeric id. Used as a
// last-resort fallback so the public site renders even when the DB is down
// or DATABASE_URL isn't configured locally.
function findStaticCourse({ slug, id }) {
  if (slug) {
    const normalized = String(slug).toLowerCase();
    return (
      staticCourses.find((c) => (c.slug || slugify(c.name)) === normalized) ||
      null
    );
  }
  if (id !== null && id !== undefined && id !== '') {
    return staticCourses.find((c) => Number(c.id) === Number(id)) || null;
  }
  return null;
}

function attachStaticSlugs(list) {
  // The bundled data may not have an explicit slug — derive one for each so
  // the frontend can link to it consistently.
  return (list || []).map((c) => ({
    ...c,
    slug: c.slug || slugify(c.name),
  }));
}

export default async function handler(req, res) {
  const slug = req?.query?.slug ? String(req.query.slug) : null;
  const idParam = req?.query?.id;
  const id = idParam !== undefined && idParam !== null && idParam !== '' ? idParam : null;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const sql = await ensureSchemaAndSeed();

    if (slug) {
      const rows = await sql`SELECT * FROM courses WHERE slug = ${slug} LIMIT 1;`;
      const course = toCourseDto(rows?.[0] || null);
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }
      res.status(200).json({ course });
      return;
    }

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
    const warning = sanitizeErrorMessage(e?.message);
    try {
      if (slug || id) {
        const course = findStaticCourse({ slug, id });
        if (!course) {
          res.status(404).json({ error: 'Course not found', warning });
          return;
        }
        res.status(200).json({
          course: { ...course, slug: course.slug || slugify(course.name) },
          warning,
        });
        return;
      }
      res.status(200).json({ courses: attachStaticSlugs(staticCourses), warning });
    } catch (e2) {
      // Last-resort: never let the request hang or expose stack traces.
      res.status(500).json({ error: warning });
    }
  }
}
