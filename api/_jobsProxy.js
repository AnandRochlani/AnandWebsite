const DEFAULT_BASE = 'https://job-aggregator-d0el.onrender.com';

export function getJobsApiBase() {
  const raw = process.env.JOBS_API_BASE_URL || DEFAULT_BASE;
  return String(raw).replace(/\/$/, '');
}

/**
 * @param {string} pathWithLeadingSlash e.g. "/jobs" or "/jobs/5"
 * @param {string} [queryString] without leading "?"
 */
export async function forwardGetJson(pathWithLeadingSlash, queryString = '') {
  const base = getJobsApiBase();
  const qs =
    queryString === '' || queryString == null
      ? ''
      : queryString.startsWith('?')
        ? queryString
        : `?${queryString}`;

  const url = `${base}${pathWithLeadingSlash}${qs}`;
  const r = await fetch(url, {
    headers: { accept: 'application/json' },
  });

  const text = await r.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { error: 'Invalid JSON from job API', detail: text?.slice(0, 200) };
  }

  return { status: r.status, body };
}

/** Vercel / Node: req.query object → query string (preserves repeated keys as arrays). */
export function vercelQueryToString(query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null && v !== '') params.append(key, String(v));
      });
    } else {
      params.append(key, String(value));
    }
  }
  return params.toString();
}
