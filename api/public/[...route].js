// Single serverless function for every /api/public/* endpoint.
//
// Vercel's Hobby plan caps a deployment at 12 functions; the per-file layout
// had 17. Handlers live on as underscore-prefixed modules (not deployed
// individually) and this catch-all dispatches to them, preserving the exact
// public URLs.
import blogPosts from './_blog-posts.js';
import companiesIndex from './_companies-index.js';
import companiesId from './_companies-id.js';
import courses from './_courses.js';
import courseBySlugOrId from './_courses-slug.js';
import jobsIndex from './_jobs-index.js';
import jobsId from './_jobs-id.js';
import settings from './_settings.js';

export default async function handler(req, res) {
  const segments = Array.isArray(req.query?.route)
    ? req.query.route
    : String(req.query?.route || '').split('/').filter(Boolean);

  // The catch-all param must not leak into handlers — the jobs/companies
  // proxies serialize req.query into the upstream query string.
  if (req.query) delete req.query.route;

  const [head, second] = segments;

  switch (head) {
    case 'blog-posts':
      return blogPosts(req, res);
    case 'settings':
      return settings(req, res);
    case 'courses':
      if (second === undefined) return courses(req, res);
      req.query.slug = second; // matches the old courses/[slug].js contract
      return courseBySlugOrId(req, res);
    case 'companies':
      if (second === undefined) return companiesIndex(req, res);
      req.query.id = second; // matches the old companies/[id].js contract
      return companiesId(req, res);
    case 'jobs':
      if (second === undefined) return jobsIndex(req, res);
      req.query.id = second; // matches the old jobs/[id].js contract
      return jobsId(req, res);
    default:
      res.status(404).json({ error: 'Not found' });
  }
}
