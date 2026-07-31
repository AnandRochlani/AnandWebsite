import handler from './_courses.js';

// REST-style alias for the existing query-string endpoint:
//   GET /api/public/courses/:slug
// Also accepts numeric ids (legacy):
//   GET /api/public/courses/9
export default async function courseBySlugOrId(req, res) {
  const raw = req?.query?.slug;
  const value = raw === undefined || raw === null ? '' : String(raw);
  const isNumeric = /^[0-9]+$/.test(value);

  const nextQuery = { ...(req.query || {}) };
  if (isNumeric) {
    // Ensure the downstream handler doesn't treat a numeric id as a slug.
    delete nextQuery.slug;
    nextQuery.id = value;
  } else {
    nextQuery.slug = value;
  }
  req.query = nextQuery;

  return handler(req, res);
}

