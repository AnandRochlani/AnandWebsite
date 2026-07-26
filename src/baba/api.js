// Thin fetch client for the Baba ERP. Cookies (auth session) are sent
// automatically via credentials: 'include'.

async function request(url, { method = 'GET', body } = {}) {
  const opts = {
    method,
    credentials: 'include',
    headers: {},
  };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

const base = (path) => `/api/baba/${path}`;

export const babaApi = {
  // Auth (reuses the app's admin session endpoints)
  me: () => request('/api/admin/me'),
  login: (username, password) => request('/api/admin/login', { method: 'POST', body: { username, password } }),
  logout: () => request('/api/admin/logout', { method: 'POST' }),

  // Dashboard & reports
  dashboard: () => request(base('dashboard')),
  reports: () => request(base('reports')),

  // Generic resource helpers
  list: (resource, query = '') => request(base(`${resource}${query}`)),
  create: (resource, body) => request(base(resource), { method: 'POST', body }),
  update: (resource, id, body) => request(base(`${resource}/${id}`), { method: 'PUT', body }),
  remove: (resource, id) => request(base(`${resource}/${id}`), { method: 'DELETE' }),
  get: (resource, id) => request(base(`${resource}/${id}`)),
};

export default babaApi;
