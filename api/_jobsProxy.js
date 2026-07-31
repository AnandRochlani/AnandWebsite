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

/**
 * Forward an arbitrary JSON request (POST/PUT/PATCH/DELETE) to the upstream
 * job aggregator API. Optional bearer token is read from JOBS_API_TOKEN.
 * @param {string} method
 * @param {string} pathWithLeadingSlash
 * @param {unknown} [body]
 * @param {string} [queryString]
 */
export async function forwardJson(method, pathWithLeadingSlash, body, queryString = '') {
  const base = getJobsApiBase();
  const qs =
    queryString === '' || queryString == null
      ? ''
      : queryString.startsWith('?')
        ? queryString
        : `?${queryString}`;

  const url = `${base}${pathWithLeadingSlash}${qs}`;
  const headers = { accept: 'application/json' };
  const token = process.env.JOBS_API_TOKEN;
  if (token) headers.authorization = `Bearer ${token}`;

  const init = {
    method,
    headers,
  };

  if (body !== undefined && body !== null && method !== 'GET' && method !== 'DELETE') {
    headers['content-type'] = 'application/json';
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const r = await fetch(url, init);

  const text = await r.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { error: 'Invalid JSON from job API', detail: text?.slice(0, 200) };
  }

  return { status: r.status, body: parsed };
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
