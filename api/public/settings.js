import { ensureSchemaAndSeed, settingsRowsToMap } from '../_db.js';
import { getDefaultSettingsMap } from '../../src/data/siteSettings.js';

function sanitizeErrorMessage(message) {
  if (!message) return 'Server error';
  return String(message).replace(/postgres(ql)?:\/\/[^@\s]+@/gi, 'postgres://***@');
}

// GET /api/public/settings
//   → { settings: { "home.hero.title.line1": "Courses &", ... } }
//
// Public, read-only. Used by the SiteSettings context on every page load.
// Falls back to the in-code defaults if the DB isn't reachable so the site
// always renders.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // No edge cache: the admin Settings tab promises that saves appear on
  // the next page load, and an `s-maxage` header would silently break that.
  // A small browser cache (10 s) still absorbs the burst of requests from
  // a single page load.
  res.setHeader('Cache-Control', 'private, max-age=10, must-revalidate');

  try {
    const sql = await ensureSchemaAndSeed();
    const rows = await sql`SELECT key, value FROM site_settings;`;
    res.status(200).json({ settings: settingsRowsToMap(rows) });
  } catch (e) {
    res.status(200).json({
      settings: getDefaultSettingsMap(),
      warning: sanitizeErrorMessage(e?.message),
    });
  }
}
