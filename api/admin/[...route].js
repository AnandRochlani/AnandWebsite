// Single serverless function for every /api/admin/* endpoint.
//
// Vercel's Hobby plan caps a deployment at 12 functions; the per-file layout
// had 17. Handlers live on as underscore-prefixed modules (not deployed
// individually) and this catch-all dispatches to them, preserving the exact
// public URLs. Each handler keeps doing its own auth via requireAdmin.
import blogOrder from './_blog-order.js';
import blogPosts from './_blog-posts.js';
import courses from './_courses.js';
import jobsIndex from './_jobs-index.js';
import jobsId from './_jobs-id.js';
import login from './_login.js';
import logout from './_logout.js';
import me from './_me.js';
import settings from './_settings.js';

export default async function handler(req, res) {
  const segments = Array.isArray(req.query?.route)
    ? req.query.route
    : String(req.query?.route || '').split('/').filter(Boolean);

  // The catch-all param must not leak into handlers (some forward req.query
  // as an upstream query string).
  if (req.query) delete req.query.route;

  const [head, second] = segments;

  switch (head) {
    case 'blog-order':
      return blogOrder(req, res);
    case 'blog-posts':
      return blogPosts(req, res);
    case 'courses':
      return courses(req, res);
    case 'login':
      return login(req, res);
    case 'logout':
      return logout(req, res);
    case 'me':
      return me(req, res);
    case 'settings':
      return settings(req, res);
    case 'jobs':
      if (second === undefined) return jobsIndex(req, res);
      req.query.id = second; // matches the old jobs/[id].js contract
      return jobsId(req, res);
    default:
      res.status(404).json({ error: 'Not found' });
  }
}
