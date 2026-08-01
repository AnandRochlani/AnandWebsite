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

/**
 * Merge the bundled catalog with the database rows, database winning per slug.
 *
 * The bundled defaults used to be a DB-outage fallback only, which meant a course
 * added in code but never seeded into Neon was invisible to /courses and 404'd on
 * in-app navigation — even though its prerendered page was live and in the sitemap.
 * This mirrors what prerender.mjs and generate-sitemap.mjs already do, so the API,
 * the static build and the sitemap agree on one catalog.
 */
export function mergeCourses(dbCourses) {
  const merged = new Map();
  for (const c of attachStaticSlugs(staticCourses)) merged.set(c.slug, c);
  for (const c of dbCourses || []) {
    const key = c.slug || slugify(c.name || c.title || String(c.id));
    // Admin edits win, but keep bundled-only fields the courses table has no
    // column for (seoTitle, seoDescription, highlights, status, workload).
    merged.set(key, merged.has(key) ? { ...merged.get(key), ...c } : c);
  }
  return [...merged.values()].sort(
    (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || Number(a.id) - Number(b.id)
  );
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
      const dbCourse = toCourseDto(rows?.[0] || null);
      const bundled = findStaticCourse({ slug });
      // A course that exists in code but has not been seeded into the database
      // must still resolve, or in-app navigation 404s on a URL that is live and
      // in the sitemap.
      const course = dbCourse && bundled ? { ...bundled, ...dbCourse } : dbCourse || bundled;
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }
      res.status(200).json({ course: { ...course, slug: course.slug || slugify(course.name) } });
      return;
    }

    if (id) {
      const rows = await sql`SELECT * FROM courses WHERE id = ${Number(id)} LIMIT 1;`;
      const dbCourse = toCourseDto(rows?.[0] || null);
      const bundled = findStaticCourse({ id });
      const course = dbCourse && bundled ? { ...bundled, ...dbCourse } : dbCourse || bundled;
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }
      res.status(200).json({ course: { ...course, slug: course.slug || slugify(course.name) } });
      return;
    }

    const rows = await sql`SELECT * FROM courses ORDER BY featured DESC, id ASC;`;
    res.status(200).json({ courses: mergeCourses(rows.map(toCourseDto)) });
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
