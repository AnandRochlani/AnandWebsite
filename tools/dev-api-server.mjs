// Tiny Node HTTP shim that mounts the Vercel-serverless handlers under api/
// at their on-disk paths. Lets us exercise the API in local dev without
// `vercel dev`, and gives Vite something to proxy /api/* to.
//
// Usage:
//   ADMIN_USERNAME=admin ADMIN_PASSWORD=admin ADMIN_JWT_SECRET=devsecret \
//     node tools/dev-api-server.mjs
//
// Behavior:
//   - Walks api/, registers each *.js file as a route at its relative path.
//     File `api/admin/courses.js` mounts at `/api/admin/courses`.
//     Dynamic `[id].js` segments become a single path segment that ends up
//     in `req.query.id`.
//   - Adapts each handler's (req, res) signature to a Node http server,
//     adding `req.body` (parsed JSON), `req.query` (parsed URL search),
//     and `res.status().json()` / `res.setHeader()`.
//   - Without DATABASE_URL, public endpoints exercise their static-fallback
//     paths; admin endpoints will fail at the DB step, which is expected.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const API_DIR = path.join(ROOT, 'api');
const PORT = Number(process.env.PORT || 5174);

function walkApi(dir, prefix = '/api') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_')) continue; // skip helpers like _db.js
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkApi(full, prefix + '/' + entry.name));
      continue;
    }
    if (!entry.name.endsWith('.js')) continue;
    const base = entry.name.replace(/\.js$/, '');
    let routePath;
    let dynamicParam = null;
    if (base === 'index') {
      routePath = prefix;
    } else if (/^\[.+\]$/.test(base)) {
      dynamicParam = base.slice(1, -1);
      routePath = prefix + '/:' + dynamicParam;
    } else {
      routePath = prefix + '/' + base;
    }
    out.push({ routePath, dynamicParam, file: full });
  }
  return out;
}

// Match a request URL against a route pattern. Returns { params } or null.
function matchRoute(routePath, urlPath) {
  if (!routePath.includes(':')) {
    return urlPath === routePath ? { params: {} } : null;
  }
  const rp = routePath.split('/');
  const up = urlPath.split('/');
  if (rp.length !== up.length) return null;
  const params = {};
  for (let i = 0; i < rp.length; i++) {
    if (rp[i].startsWith(':')) {
      params[rp[i].slice(1)] = decodeURIComponent(up[i]);
    } else if (rp[i] !== up[i]) {
      return null;
    }
  }
  return { params };
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 5 * 1024 * 1024) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (_) { resolve({}); }
    });
    req.on('error', reject);
  });
}

function adaptRes(rawRes) {
  let statusCode = 200;
  const proxy = {
    setHeader: (k, v) => rawRes.setHeader(k, v),
    getHeader: (k) => rawRes.getHeader(k),
    status: (code) => { statusCode = code; return proxy; },
    json: (payload) => {
      rawRes.statusCode = statusCode;
      if (!rawRes.getHeader('content-type')) {
        rawRes.setHeader('content-type', 'application/json');
      }
      rawRes.end(JSON.stringify(payload));
      return proxy;
    },
    send: (text) => {
      rawRes.statusCode = statusCode;
      rawRes.end(typeof text === 'string' ? text : JSON.stringify(text));
      return proxy;
    },
    end: (...args) => { rawRes.statusCode = statusCode; rawRes.end(...args); },
  };
  return proxy;
}

const routes = walkApi(API_DIR).sort((a, b) => {
  // Prefer non-dynamic routes first so /api/foo wins over /api/:id.
  return (a.dynamicParam ? 1 : 0) - (b.dynamicParam ? 1 : 0);
});
console.log('[dev-api] mounted routes:');
for (const r of routes) console.log('   ', r.routePath, '←', path.relative(ROOT, r.file));

const handlers = new Map();
async function loadHandler(file) {
  if (handlers.has(file)) return handlers.get(file);
  const mod = await import(pathToFileURL(file).href);
  const fn = mod.default;
  if (typeof fn !== 'function') {
    throw new Error(`Handler at ${file} has no default export`);
  }
  handlers.set(file, fn);
  return fn;
}

const server = http.createServer(async (rawReq, rawRes) => {
  const url = new URL(rawReq.url, `http://localhost:${PORT}`);
  let matched = null;
  for (const r of routes) {
    const m = matchRoute(r.routePath, url.pathname);
    if (m) { matched = { route: r, params: m.params }; break; }
  }
  if (!matched) {
    rawRes.statusCode = 404;
    rawRes.setHeader('content-type', 'application/json');
    rawRes.end(JSON.stringify({ error: 'Not found', path: url.pathname }));
    return;
  }

  const query = Object.fromEntries(url.searchParams.entries());
  for (const [k, v] of Object.entries(matched.params)) query[k] = v;

  const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(rawReq.method)
    ? await readJsonBody(rawReq).catch(() => ({}))
    : {};

  const req = Object.assign(rawReq, { query, body });
  const res = adaptRes(rawRes);

  try {
    const fn = await loadHandler(matched.route.file);
    await fn(req, res);
  } catch (e) {
    console.error('[dev-api] handler error', matched.route.routePath, e);
    if (!rawRes.headersSent) {
      rawRes.statusCode = 500;
      rawRes.setHeader('content-type', 'application/json');
      rawRes.end(JSON.stringify({ error: 'Handler crashed', detail: String(e?.message || e) }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`[dev-api] listening on http://localhost:${PORT}`);
});
