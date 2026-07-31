#!/usr/bin/env node
/**
 * Technical SEO audit for anandrochlani.com (Vite + React SPA on Vercel).
 *
 *   node seo-pipeline/audit.mjs                 # audit the live canonical host
 *   node seo-pipeline/audit.mjs --limit 10      # crawl at most 10 URLs
 *   node seo-pipeline/audit.mjs --json          # machine-readable output only
 *   node seo-pipeline/audit.mjs --help
 *
 * Crawls the live site with zero npm dependencies (Node 18+ built-ins only) and
 * reports findings grouped CRITICAL / WARNING / PASS. Exits 1 on any CRITICAL so
 * it can gate CI. Also writes seo-pipeline/reports/audit-latest.json.
 *
 * IMPORTANT: the canonical host is the APEX domain https://anandrochlani.com.
 * The `www.` variant has a broken TLS certificate and must never be referenced
 * in sitemaps, robots.txt, canonical tags or og:url. The audit tests it
 * explicitly and fails loudly when site metadata points at a host that does not
 * serve 200.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(HERE, 'reports');
const REPORT_FILE = path.join(REPORTS_DIR, 'audit-latest.json');

const DEFAULT_BASE = 'https://anandrochlani.com';
const UA =
  'AnandRochlaniSEOAudit/1.0 (+https://anandrochlani.com; technical SEO self-audit; node-fetch)';
const REQUEST_TIMEOUT_MS = 25_000;
const MAX_REDIRECT_HOPS = 6;

/* ------------------------------------------------------------------ *
 * CLI
 * ------------------------------------------------------------------ */

const HELP = `
Technical SEO audit for a Vite + React SPA (anandrochlani.com).

Usage:
  node seo-pipeline/audit.mjs [options]

Options:
  --base <url>        Base URL to audit          (default: ${DEFAULT_BASE})
  --limit <n>         Max number of page URLs to crawl (default: no limit)
  --json              Print JSON only (no human report)
  --concurrency <n>   Max parallel requests, 1-4  (default: 4)
  --delay <ms>        Delay before each request    (default: 150)
  --no-report         Do not write reports/audit-latest.json
  --help, -h          Show this help

Exit codes:
  0  no CRITICAL findings
  1  at least one CRITICAL finding
  2  the audit itself could not run (bad flags, base host unreachable)

Output:
  Console report grouped CRITICAL / WARNING / PASS, plus
  seo-pipeline/reports/audit-latest.json (machine readable).
`.trim();

function parseArgs(argv) {
  const opts = {
    base: DEFAULT_BASE,
    limit: Infinity,
    json: false,
    concurrency: 4,
    delay: 150,
    writeReport: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} requires a value`);
      return v;
    };
    switch (a) {
      case '--help':
      case '-h':
        console.log(HELP);
        process.exit(0);
        break;
      case '--base':
        opts.base = next();
        break;
      case '--limit': {
        const n = Number(next());
        if (!Number.isFinite(n) || n < 1) throw new Error('--limit must be a positive number');
        opts.limit = Math.floor(n);
        break;
      }
      case '--json':
        opts.json = true;
        break;
      case '--concurrency': {
        const n = Number(next());
        if (!Number.isFinite(n) || n < 1) throw new Error('--concurrency must be >= 1');
        opts.concurrency = Math.min(4, Math.floor(n));
        break;
      }
      case '--delay': {
        const n = Number(next());
        if (!Number.isFinite(n) || n < 0) throw new Error('--delay must be >= 0');
        opts.delay = Math.floor(n);
        break;
      }
      case '--no-report':
        opts.writeReport = false;
        break;
      default:
        throw new Error(`unknown option: ${a}`);
    }
  }
  if (!/^https?:\/\//i.test(opts.base)) opts.base = `https://${opts.base}`;
  opts.base = opts.base.replace(/\/+$/, '');
  // validate
  new URL(opts.base);
  return opts;
}

/* ------------------------------------------------------------------ *
 * Findings
 * ------------------------------------------------------------------ */

const SEVERITY = { CRITICAL: 0, WARNING: 1, PASS: 2 };
const findings = [];

/**
 * @param {'CRITICAL'|'WARNING'|'PASS'} severity
 * @param {string} code   stable machine-readable id
 * @param {string} message one-line human detail
 * @param {{url?:string, fix?:string, data?:any}} [extra]
 */
function add(severity, code, message, extra = {}) {
  findings.push({
    severity,
    code,
    message,
    url: extra.url || null,
    fix: extra.fix || FIX_HINTS[code] || null,
    data: extra.data === undefined ? null : extra.data,
  });
}

const FIX_HINTS = {
  FETCH_ERROR: 'Check the deployment and DNS; the URL must respond over HTTPS on the apex host.',
  NON_200: 'Fix the route or remove the URL from the sitemap and internal links.',
  REDIRECT_CHAIN: 'Point links/sitemap at the final URL so there is at most one hop.',
  REDIRECT_TO_BROKEN_HOST:
    'Redirect to the apex host https://anandrochlani.com — the www host has a broken TLS certificate.',
  HTTP_NOT_UPGRADED: 'Add a permanent http -> https redirect for the apex host.',
  CANONICAL_HOST_DOWN:
    'The canonical host must serve 200 over TLS before anything else can be fixed.',
  WWW_HOST_BROKEN:
    'Expected: never reference www. Keep every sitemap/robots/canonical/og:url on the apex host.',
  METADATA_BROKEN_HOST:
    'Rewrite every occurrence of https://www.anandrochlani.com to https://anandrochlani.com.',
  MISSING_TITLE: 'Emit a unique <title> per route (prerender or SSR the head).',
  DUPLICATE_TITLE:
    'Prerender per-route <title>; react-helmet runs client-side only, so crawlers see one shared title.',
  DUPLICATE_DESCRIPTION:
    'Prerender per-route meta description; identical descriptions collapse the pages in search results.',
  MISSING_DESCRIPTION: 'Add a 70-160 char meta description to the served HTML.',
  TITLE_LENGTH: 'Aim for 30-60 characters so the title is not truncated in SERPs.',
  DESCRIPTION_LENGTH: 'Aim for 70-160 characters.',
  MISSING_CANONICAL: 'Add <link rel="canonical"> with the absolute apex-host URL in the served HTML.',
  CANONICAL_MISMATCH: 'The canonical URL must be the page\'s own absolute apex-host URL.',
  ROBOTS_META_NOINDEX: 'Remove noindex from pages that should rank.',
  MISSING_OG: 'Add og:title, og:description and og:image to the served HTML.',
  MISSING_TWITTER_CARD: 'Add <meta name="twitter:card" content="summary_large_image">.',
  MISSING_JSONLD:
    'Emit Article/BreadcrumbList JSON-LD in the served HTML (client-injected JSON-LD is unreliable).',
  INVALID_JSONLD: 'Fix the JSON syntax inside the ld+json script block.',
  CLIENT_RENDERED_ONLY:
    'Prerender the routes (vite-ssg / prerender step) so the HTML contains the real headline and body.',
  SHELL_IDENTICAL:
    'Every route returns the same index.html; prerender per-route HTML so crawlers see unique content.',
  MISSING_H1: 'Ensure the served HTML has exactly one <h1> containing the page headline.',
  MULTIPLE_H1: 'Keep a single <h1> per page; demote the rest to <h2>.',
  IMG_MISSING_ALT: 'Add descriptive alt text to every content image.',
  IMG_NO_LAZY: 'Add loading="lazy" to below-the-fold images.',
  SITEMAP_MISSING: 'Publish /sitemap.xml at the canonical host.',
  SITEMAP_INVALID: 'Regenerate the sitemap: it must be valid XML with a <urlset> and <loc> entries.',
  SITEMAP_WRONG_HOST:
    'Regenerate the sitemap with https://anandrochlani.com — www has a broken certificate.',
  SITEMAP_URL_BAD: 'Remove or fix sitemap URLs that do not return 200.',
  SOFT_404:
    'The SPA catch-all rewrite answers 200 for unknown paths. Serve a real 404 status (or a 404 route with meta robots noindex) so dead URLs drop out of the index.',
  SITEMAP_MISSING_URL: 'Add the live URL to the sitemap (run seo-pipeline/generate-sitemap.mjs).',
  SITEMAP_STALE_URL: 'Remove URLs that no longer exist from the sitemap.',
  ROBOTS_MISSING: 'Publish /robots.txt at the canonical host.',
  ROBOTS_BLOCKS_CONTENT: 'Remove the Disallow rule that blocks indexable content.',
  ROBOTS_SITEMAP_MISSING: 'Declare "Sitemap: https://anandrochlani.com/sitemap.xml" in robots.txt.',
  ROBOTS_SITEMAP_UNREACHABLE: 'Point the Sitemap: line at a URL that returns 200 on the apex host.',
  API_UNREACHABLE: 'The public content API must respond so the URL inventory can be built.',
};

/* ------------------------------------------------------------------ *
 * HTTP
 * ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let DELAY = 150;

/**
 * Fetch following redirects manually so the chain is observable.
 * Never throws — errors come back as { error }.
 */
async function request(url, { method = 'GET' } = {}) {
  const chain = [];
  let current = url;
  let error = null;
  let response = null;
  let body = '';

  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop++) {
    let res;
    try {
      res = await fetch(current, {
        method,
        redirect: 'manual',
        headers: { 'user-agent': UA, accept: '*/*' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (e) {
      error = describeFetchError(e);
      break;
    }
    const location = res.headers.get('location');
    chain.push({ url: current, status: res.status, location: location || null });

    if (res.status >= 300 && res.status < 400 && location) {
      let nextUrl;
      try {
        nextUrl = new URL(location, current).toString();
      } catch {
        error = `invalid Location header: ${location}`;
        break;
      }
      if (chain.some((c) => c.url === nextUrl)) {
        error = `redirect loop at ${nextUrl}`;
        break;
      }
      current = nextUrl;
      if (hop === MAX_REDIRECT_HOPS) error = `too many redirects (> ${MAX_REDIRECT_HOPS})`;
      continue;
    }

    response = res;
    if (method !== 'HEAD') {
      try {
        body = await res.text();
      } catch (e) {
        error = `could not read body: ${e.message}`;
      }
    }
    break;
  }

  return {
    requestedUrl: url,
    finalUrl: response ? current : chain.length ? chain[chain.length - 1].url : url,
    status: response ? response.status : null,
    ok: !!response && response.status >= 200 && response.status < 300,
    headers: response ? Object.fromEntries(response.headers.entries()) : {},
    chain,
    hops: Math.max(0, chain.length - 1),
    body,
    error,
  };
}

function describeFetchError(e) {
  const parts = [e.name, e.message].filter(Boolean);
  let cause = e.cause;
  const seen = new Set();
  while (cause && !seen.has(cause)) {
    seen.add(cause);
    if (cause.code) parts.push(cause.code);
    if (cause.message && !parts.includes(cause.message)) parts.push(cause.message);
    cause = cause.cause;
  }
  return [...new Set(parts)].join(' | ') || String(e);
}

async function pool(items, worker, concurrency) {
  const out = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length || 1) }, async () => {
    for (;;) {
      const i = cursor++;
      if (i >= items.length) return;
      if (DELAY) await sleep(DELAY);
      try {
        out[i] = await worker(items[i], i);
      } catch (e) {
        out[i] = { __workerError: e && e.message ? e.message : String(e) };
      }
    }
  });
  await Promise.all(runners);
  return out;
}

/* ------------------------------------------------------------------ *
 * HTML parsing (regex only, must never throw)
 * ------------------------------------------------------------------ */

const ATTR_RE = /([a-zA-Z_:@][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>`]+))/g;

function parseAttrs(tag) {
  const attrs = {};
  ATTR_RE.lastIndex = 0;
  let m;
  while ((m = ATTR_RE.exec(tag))) {
    const key = m[1].toLowerCase();
    if (!(key in attrs)) attrs[key] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return attrs;
}

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  '#39': "'", '#x27': "'", '#8217': '’', '#160': ' ',
};

function decodeEntities(s) {
  return String(s).replace(/&(#?[a-zA-Z0-9]+);/g, (full, code) => {
    const key = code.toLowerCase();
    if (ENTITIES[key] !== undefined) return ENTITIES[key];
    if (/^#\d+$/.test(code)) {
      try { return String.fromCodePoint(Number(code.slice(1))); } catch { return full; }
    }
    if (/^#x[0-9a-f]+$/i.test(code)) {
      try { return String.fromCodePoint(parseInt(code.slice(2), 16)); } catch { return full; }
    }
    return full;
  });
}

/** Collapse to comparable alphanumeric word stream. */
function norm(s) {
  return decodeEntities(String(s || ''))
    .replace(/<[^>]*>/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function stripScriptsAndStyles(html) {
  return String(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

function parseHtml(html) {
  const out = {
    title: null,
    metas: [],
    canonical: null,
    robotsMeta: null,
    og: {},
    twitter: {},
    description: null,
    jsonLd: [],
    jsonLdErrors: [],
    h1s: [],
    images: [],
    textLength: 0,
    text: '',
    parseErrors: [],
  };
  try {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) out.title = decodeEntities(titleMatch[1]).replace(/\s+/g, ' ').trim();

    for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
      const a = parseAttrs(m[0]);
      out.metas.push(a);
      const key = (a.name || a.property || a['http-equiv'] || '').toLowerCase();
      const content = a.content !== undefined ? decodeEntities(a.content).trim() : '';
      if (!key) continue;
      if (key === 'description' && out.description === null) out.description = content;
      if (key === 'robots') out.robotsMeta = content;
      if (key.startsWith('og:')) out.og[key.slice(3)] = content;
      if (key.startsWith('twitter:')) out.twitter[key.slice(8)] = content;
    }

    for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
      const a = parseAttrs(m[0]);
      if ((a.rel || '').toLowerCase().split(/\s+/).includes('canonical') && a.href) {
        if (out.canonical === null) out.canonical = decodeEntities(a.href).trim();
      }
    }

    for (const m of html.matchAll(
      /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )) {
      const raw = m[1].trim();
      if (!raw) continue;
      try {
        out.jsonLd.push(JSON.parse(raw));
      } catch (e) {
        out.jsonLdErrors.push(e.message);
      }
    }

    for (const m of html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)) {
      out.h1s.push(decodeEntities(m[1].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim());
    }

    for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
      const a = parseAttrs(m[0]);
      out.images.push({
        src: a.src || a['data-src'] || '',
        hasAlt: Object.prototype.hasOwnProperty.call(a, 'alt'),
        alt: a.alt ?? null,
        lazy: (a.loading || '').toLowerCase() === 'lazy',
        eager: (a.loading || '').toLowerCase() === 'eager',
      });
    }

    const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
    const scope = bodyMatch ? bodyMatch[1] : html;
    out.text = norm(stripScriptsAndStyles(scope));
    out.textLength = out.text.length;
  } catch (e) {
    out.parseErrors.push(e.message);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * URL inventory
 * ------------------------------------------------------------------ */

const STATIC_ROUTES = ['/', '/courses', '/blog', '/jobs'];

async function loadInventory(base) {
  const inventory = { posts: [], courses: [], apiErrors: [] };

  const postsRes = await request(`${base}/api/public/blog-posts`);
  if (!postsRes.ok || postsRes.error) {
    inventory.apiErrors.push(
      `GET /api/public/blog-posts -> ${postsRes.error || postsRes.status}`
    );
  } else {
    try {
      const data = JSON.parse(postsRes.body);
      inventory.posts = Array.isArray(data.posts) ? data.posts.filter((p) => p && p.slug) : [];
    } catch (e) {
      inventory.apiErrors.push(`blog-posts JSON parse failed: ${e.message}`);
    }
  }

  const coursesRes = await request(`${base}/api/public/courses`);
  if (coursesRes.ok && !coursesRes.error) {
    try {
      const data = JSON.parse(coursesRes.body);
      inventory.courses = Array.isArray(data.courses)
        ? data.courses.filter((c) => c && (c.id !== undefined || c.slug))
        : [];
    } catch {
      /* courses are optional for the audit */
    }
  }

  return inventory;
}

function buildUrlList(base, inventory) {
  const urls = [];
  const seen = new Set();
  const push = (route, kind, meta) => {
    const url = `${base}${route}`;
    if (seen.has(url)) return;
    seen.add(url);
    urls.push({ url, route, kind, meta: meta || null });
  };

  for (const r of STATIC_ROUTES) push(r, r === '/' ? 'home' : 'listing');
  for (const c of inventory.courses) push(`/courses/${c.slug ?? c.id}`, 'course', { id: c.id, name: c.name });
  for (const p of inventory.posts) push(`/blog/${p.slug}`, 'post', p);
  return urls;
}

/* ------------------------------------------------------------------ *
 * Checks
 * ------------------------------------------------------------------ */

function hostOf(u) {
  try { return new URL(u).host.toLowerCase(); } catch { return null; }
}

function pathOf(u) {
  try {
    const p = new URL(u).pathname;
    return p.length > 1 ? p.replace(/\/+$/, '') : '/';
  } catch { return null; }
}

/** 2. Hostname health, incl. explicit www probe and http upgrade. */
async function checkHosts(base) {
  const canonicalHost = hostOf(base);
  const result = { canonicalHost, hosts: {} };

  const apex = await request(`${base}/`);
  result.hosts[canonicalHost] = {
    url: `${base}/`,
    status: apex.status,
    ok: apex.ok,
    error: apex.error,
    hops: apex.hops,
    chain: apex.chain,
  };
  if (apex.error || !apex.ok) {
    add('CRITICAL', 'CANONICAL_HOST_DOWN',
      `Canonical host ${canonicalHost} did not serve 200 (${apex.error || `HTTP ${apex.status}`})`,
      { url: `${base}/` });
  } else {
    add('PASS', 'CANONICAL_HOST_OK', `Canonical host ${canonicalHost} serves 200 over TLS`, {
      url: `${base}/`,
    });
  }

  // www variant — probed so metadata referencing it can be judged, never recommended.
  const wwwHost = canonicalHost.startsWith('www.') ? canonicalHost : `www.${canonicalHost}`;
  const wwwUrl = `https://${wwwHost}/`;
  const www = await request(wwwUrl);
  result.hosts[wwwHost] = {
    url: wwwUrl,
    status: www.status,
    ok: www.ok,
    error: www.error,
    hops: www.hops,
    chain: www.chain,
  };
  if (www.error || !www.ok) {
    add('PASS', 'WWW_HOST_BROKEN',
      `www variant ${wwwHost} does NOT serve 200 (${www.error || `HTTP ${www.status}`}) — confirmed unusable; nothing may reference it`,
      { url: wwwUrl });
  } else {
    add('WARNING', 'WWW_HOST_BROKEN',
      `${wwwHost} unexpectedly answered ${www.status}; the apex host stays canonical regardless`,
      { url: wwwUrl });
  }

  // http -> https upgrade on the canonical host
  const httpUrl = `http://${canonicalHost}/`;
  const httpRes = await request(httpUrl);
  result.hosts[`http://${canonicalHost}`] = {
    url: httpUrl,
    status: httpRes.status,
    ok: httpRes.ok,
    error: httpRes.error,
    finalUrl: httpRes.finalUrl,
    chain: httpRes.chain,
  };
  if (httpRes.error) {
    add('WARNING', 'HTTP_NOT_UPGRADED', `http://${canonicalHost}/ failed: ${httpRes.error}`, {
      url: httpUrl,
    });
  } else if (!/^https:/i.test(httpRes.finalUrl)) {
    add('CRITICAL', 'HTTP_NOT_UPGRADED',
      `http://${canonicalHost}/ did not end on https (final ${httpRes.finalUrl})`, { url: httpUrl });
  } else if (hostOf(httpRes.finalUrl) !== canonicalHost) {
    add('CRITICAL', 'REDIRECT_TO_BROKEN_HOST',
      `http://${canonicalHost}/ redirects to ${hostOf(httpRes.finalUrl)} instead of ${canonicalHost}`,
      { url: httpUrl });
  } else {
    add('PASS', 'HTTP_UPGRADED', `http://${canonicalHost}/ upgrades to https on the same host`, {
      url: httpUrl,
    });
  }

  result.hosts[`${canonicalHost} (http)`] = result.hosts[`http://${canonicalHost}`];
  delete result.hosts[`http://${canonicalHost}`];

  // Only real hostnames go in brokenHosts — it is matched against URL hosts.
  result.brokenHosts = [canonicalHost, wwwHost].filter((h) => result.hosts[h] && !result.hosts[h].ok);
  return result;
}

/**
 * Soft-404 probe. A Vercel SPA catch-all rewrite answers 200 for every path, so
 * "returns 200" is a weak liveness signal and dead URLs stay indexable.
 */
async function checkSoft404(base, shellText) {
  const probePath = `/__seo-audit-probe-${Date.now().toString(36)}`;
  const res = await request(`${base}${probePath}`);
  const out = { url: `${base}${probePath}`, status: res.status, error: res.error, soft404: false };

  if (res.error) {
    add('WARNING', 'SOFT_404', `404 probe ${probePath} failed: ${res.error}`, { url: out.url });
    return out;
  }
  if (res.status === 404 || res.status === 410) {
    add('PASS', 'HARD_404', `unknown paths return HTTP ${res.status} (no soft 404s)`, {
      url: out.url,
    });
    return out;
  }
  out.soft404 = true;
  const parsed = parseHtml(res.body || '');
  const sameShell = shellText !== null && norm(stripScriptsAndStyles(res.body || '')) !== '' &&
    parsed && shellText === bodyTextOf(res.body || '');
  const noindex = parsed.robotsMeta && /noindex/i.test(parsed.robotsMeta);
  add('CRITICAL', 'SOFT_404',
    `unknown path ${probePath} returns HTTP ${res.status}${sameShell ? ' with the generic SPA shell' : ''}${noindex ? ' (but is noindex)' : ' and is indexable'} — every dead/mistyped URL is a soft 404`,
    { url: out.url });
  return out;
}

function bodyTextOf(html) {
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
  return norm(stripScriptsAndStyles(bodyMatch ? bodyMatch[1] : html));
}

/** 1 + 3 + 4 + 5 + 8: per-URL crawl. */
async function crawlPages(entries, ctx) {
  const { canonicalHost, hostHealth } = ctx;
  const pages = [];

  const results = await pool(entries, async (entry) => {
    const res = await request(entry.url);
    return { entry, res };
  }, ctx.concurrency);

  for (const item of results) {
    if (!item || item.__workerError) {
      add('CRITICAL', 'FETCH_ERROR', `internal crawl error: ${item && item.__workerError}`);
      continue;
    }
    const { entry, res } = item;
    const page = {
      url: entry.url,
      route: entry.route,
      kind: entry.kind,
      status: res.status,
      hops: res.hops,
      chain: res.chain,
      error: res.error,
      bytes: res.body ? res.body.length : 0,
      seo: null,
    };

    // ---- 1. status + redirect chain
    if (res.error) {
      add('CRITICAL', 'FETCH_ERROR', `${entry.route} — ${res.error}`, { url: entry.url });
      pages.push(page);
      continue;
    }
    if (!res.ok) {
      add('CRITICAL', 'NON_200', `${entry.route} returned HTTP ${res.status}`, { url: entry.url });
    }
    if (res.hops > 1) {
      add('WARNING', 'REDIRECT_CHAIN',
        `${entry.route} took ${res.hops} redirect hops (${res.chain.map((c) => c.status).join(' -> ')})`,
        { url: entry.url, data: res.chain });
    }
    for (const hop of res.chain) {
      if (hop.location) {
        const h = hostOf(new URL(hop.location, hop.url).toString());
        if (h && h !== canonicalHost && hostHealth.brokenHosts.includes(h)) {
          add('CRITICAL', 'REDIRECT_TO_BROKEN_HOST',
            `${entry.route} redirects to ${h}, which does not serve 200`, { url: entry.url });
        }
      }
    }

    if (!res.body) {
      add('CRITICAL', 'FETCH_ERROR', `${entry.route} returned an empty body`, { url: entry.url });
      pages.push(page);
      continue;
    }

    // ---- 3. SEO tags
    const seo = parseHtml(res.body);
    page.seo = {
      title: seo.title,
      titleLength: seo.title ? seo.title.length : 0,
      description: seo.description,
      descriptionLength: seo.description ? seo.description.length : 0,
      canonical: seo.canonical,
      robotsMeta: seo.robotsMeta,
      og: seo.og,
      twitterCard: seo.twitter.card || null,
      jsonLdCount: seo.jsonLd.length,
      jsonLdErrors: seo.jsonLdErrors,
      h1Count: seo.h1s.length,
      h1s: seo.h1s,
      imageCount: seo.images.length,
      imagesMissingAlt: seo.images.filter((i) => !i.hasAlt).length,
      imagesEmptyAlt: seo.images.filter((i) => i.hasAlt && !String(i.alt).trim()).length,
      imagesLazy: seo.images.filter((i) => i.lazy).length,
      textLength: seo.textLength,
      parseErrors: seo.parseErrors,
    };
    page._text = seo.text;

    if (seo.parseErrors.length) {
      add('WARNING', 'HTML_PARSE_ERROR', `${entry.route} — ${seo.parseErrors.join('; ')}`, {
        url: entry.url,
      });
    }
    if (!seo.title) {
      add('CRITICAL', 'MISSING_TITLE', `${entry.route} has no <title>`, { url: entry.url });
    } else if (seo.title.length < 30 || seo.title.length > 60) {
      add('WARNING', 'TITLE_LENGTH',
        `${entry.route} title is ${seo.title.length} chars (want 30-60): "${truncate(seo.title, 70)}"`,
        { url: entry.url });
    }
    if (!seo.description) {
      add('CRITICAL', 'MISSING_DESCRIPTION', `${entry.route} has no meta description`, {
        url: entry.url,
      });
    } else if (seo.description.length < 70 || seo.description.length > 160) {
      add('WARNING', 'DESCRIPTION_LENGTH',
        `${entry.route} description is ${seo.description.length} chars (want 70-160)`,
        { url: entry.url });
    }
    if (!seo.canonical) {
      add('CRITICAL', 'MISSING_CANONICAL', `${entry.route} has no <link rel="canonical">`, {
        url: entry.url,
      });
    } else {
      const cHost = hostOf(seo.canonical.startsWith('http') ? seo.canonical : `https://${canonicalHost}${seo.canonical}`);
      if (cHost && cHost !== canonicalHost) {
        const sev = hostHealth.brokenHosts.includes(cHost) ? 'CRITICAL' : 'WARNING';
        add(sev, 'METADATA_BROKEN_HOST',
          `${entry.route} canonical points at ${cHost}${hostHealth.brokenHosts.includes(cHost) ? ' which does NOT serve 200' : ''}`,
          { url: entry.url });
      } else if (pathOf(seo.canonical) !== pathOf(entry.url)) {
        add('WARNING', 'CANONICAL_MISMATCH',
          `${entry.route} canonical is ${seo.canonical} (expected its own URL)`, { url: entry.url });
      }
    }
    if (seo.robotsMeta && /noindex/i.test(seo.robotsMeta)) {
      add('CRITICAL', 'ROBOTS_META_NOINDEX',
        `${entry.route} has meta robots "${seo.robotsMeta}"`, { url: entry.url });
    }
    const missingOg = ['title', 'description', 'image'].filter((k) => !seo.og[k]);
    if (missingOg.length) {
      add('WARNING', 'MISSING_OG',
        `${entry.route} is missing og:${missingOg.join(', og:')}`, { url: entry.url });
    }
    if (seo.og.image && !/^https?:\/\//i.test(seo.og.image)) {
      add('WARNING', 'OG_IMAGE_RELATIVE',
        `${entry.route} og:image is relative ("${truncate(seo.og.image, 60)}"); social crawlers need an absolute URL`,
        { url: entry.url });
    }
    if (seo.og.url) {
      const ogHost = hostOf(seo.og.url);
      if (ogHost && ogHost !== canonicalHost) {
        const sev = hostHealth.brokenHosts.includes(ogHost) ? 'CRITICAL' : 'WARNING';
        add(sev, 'METADATA_BROKEN_HOST', `${entry.route} og:url points at ${ogHost}`, {
          url: entry.url,
        });
      }
    }
    if (!seo.twitter.card) {
      add('WARNING', 'MISSING_TWITTER_CARD', `${entry.route} has no twitter:card`, {
        url: entry.url,
      });
    }
    if (seo.jsonLdErrors.length) {
      add('CRITICAL', 'INVALID_JSONLD',
        `${entry.route} has malformed JSON-LD: ${seo.jsonLdErrors.join('; ')}`, { url: entry.url });
    } else if (seo.jsonLd.length === 0) {
      add('WARNING', 'MISSING_JSONLD', `${entry.route} has no JSON-LD structured data`, {
        url: entry.url,
      });
    }

    // ---- 5. H1
    if (seo.h1s.length === 0) {
      add('WARNING', 'MISSING_H1', `${entry.route} has no <h1> in the served HTML`, {
        url: entry.url,
      });
    } else if (seo.h1s.length > 1) {
      add('WARNING', 'MULTIPLE_H1', `${entry.route} has ${seo.h1s.length} <h1> elements`, {
        url: entry.url,
      });
    }

    // ---- 8. images
    if (page.seo.imagesMissingAlt > 0) {
      add('WARNING', 'IMG_MISSING_ALT',
        `${entry.route} has ${page.seo.imagesMissingAlt}/${page.seo.imageCount} <img> without an alt attribute`,
        { url: entry.url });
    }
    if (page.seo.imageCount > 2 && page.seo.imagesLazy === 0) {
      add('WARNING', 'IMG_NO_LAZY',
        `${entry.route} has ${page.seo.imageCount} images and none use loading="lazy"`,
        { url: entry.url });
    }

    pages.push(page);
  }

  return pages;
}

/** 4. Content presence + duplicate metadata across URLs. */
function checkContentAndDuplicates(pages, canonicalHost) {
  const rendered = pages.filter((p) => p.seo && p._text !== undefined);

  // Identify the generic SPA shell: the normalized body text of "/" .
  const home = rendered.find((p) => p.route === '/');
  const shellText = home ? home._text : null;

  for (const p of rendered) {
    const entryMeta = p.kind === 'post' ? p.__post : null;
    let expectedNeedles = [];
    if (p.__post) {
      const t = norm(p.__post.title);
      if (t) expectedNeedles.push(t.split(' ').slice(0, 8).join(' '));
      const bodyText = norm(p.__post.content || '');
      if (bodyText.length > 200) {
        const words = bodyText.split(' ');
        const mid = Math.floor(words.length / 2);
        expectedNeedles.push(words.slice(mid, mid + 8).join(' '));
      }
    } else if (p.kind === 'course' && p.__course) {
      const t = norm(p.__course.name);
      if (t) expectedNeedles.push(t.split(' ').slice(0, 6).join(' '));
    }
    expectedNeedles = expectedNeedles.filter((n) => n && n.split(' ').length >= 4);

    const found = expectedNeedles.filter((n) => p._text.includes(n));
    const sameAsShell = shellText !== null && p.route !== '/' && p._text === shellText;

    p.contentPresence = {
      needlesChecked: expectedNeedles.length,
      needlesFound: found.length,
      identicalToHomeShell: sameAsShell,
      clientRenderedOnly: expectedNeedles.length > 0 ? found.length === 0 : sameAsShell,
    };

    if (expectedNeedles.length > 0 && found.length === 0) {
      add('CRITICAL', 'CLIENT_RENDERED_ONLY',
        `${p.route} — served HTML contains none of the page's own headline/body text (crawlers see only the SPA shell)`,
        { url: p.url });
    } else if (sameAsShell) {
      add('CRITICAL', 'SHELL_IDENTICAL',
        `${p.route} — served HTML body is byte-identical to the homepage shell`, { url: p.url });
    } else if (expectedNeedles.length > 0) {
      add('PASS', 'CONTENT_IN_HTML', `${p.route} — real content present in the served HTML`, {
        url: p.url,
      });
    }
    delete p._text;
    void entryMeta;
  }

  // ---- duplicates
  const dupGroup = (key, code, label) => {
    const map = new Map();
    for (const p of rendered) {
      const v = p.seo && p.seo[key];
      if (!v) continue;
      const k = norm(v);
      if (!k) continue;
      if (!map.has(k)) map.set(k, { value: v, urls: [] });
      map.get(k).urls.push(p.route);
    }
    let dupes = 0;
    for (const [, g] of map) {
      if (g.urls.length > 1) {
        dupes++;
        add('CRITICAL', code,
          `${g.urls.length} pages share the same ${label}: "${truncate(g.value, 60)}" (${g.urls.slice(0, 4).join(', ')}${g.urls.length > 4 ? `, +${g.urls.length - 4} more` : ''})`,
          { data: { value: g.value, urls: g.urls } });
      }
    }
    if (dupes === 0 && map.size > 0) {
      add('PASS', `UNIQUE_${label.toUpperCase().replace(/\s+/g, '_')}`,
        `all ${map.size} crawled pages have a unique ${label}`);
    }
    return map;
  };

  dupGroup('title', 'DUPLICATE_TITLE', 'title');
  dupGroup('description', 'DUPLICATE_DESCRIPTION', 'description');

  void canonicalHost;
  return shellText;
}

/** 6. sitemap.xml */
async function checkSitemap(base, canonicalHost, expectedPaths, hostHealth, concurrency, soft404) {
  const url = `${base}/sitemap.xml`;
  const res = await request(url);
  const out = { url, status: res.status, error: res.error, locs: [], checked: [] };

  if (res.error || !res.ok) {
    add('CRITICAL', 'SITEMAP_MISSING',
      `${url} -> ${res.error || `HTTP ${res.status}`}`, { url });
    return out;
  }

  const xml = res.body;
  const looksXml = /<\?xml[\s\S]*?\?>/.test(xml) || /<urlset|<sitemapindex/i.test(xml);
  const balanced =
    (/<urlset[\s>]/i.test(xml) && /<\/urlset>/i.test(xml)) ||
    (/<sitemapindex[\s>]/i.test(xml) && /<\/sitemapindex>/i.test(xml));
  if (!looksXml || !balanced) {
    add('CRITICAL', 'SITEMAP_INVALID',
      `${url} is not a well-formed sitemap (missing <?xml?>/<urlset>...</urlset>)`, { url });
    return out;
  }
  const urlBlocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)].length;
  const locs = [...xml.matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi)].map((m) =>
    decodeEntities(m[1]).trim()
  );
  out.locs = locs;
  out.urlBlocks = urlBlocks;

  if (locs.length === 0) {
    add('CRITICAL', 'SITEMAP_INVALID', `${url} contains zero <loc> entries`, { url });
    return out;
  }
  add('PASS', 'SITEMAP_PARSES', `${url} parses with ${locs.length} <loc> entries`, { url });

  // host correctness
  const badHostLocs = locs.filter((l) => {
    const h = hostOf(l);
    return h && h !== canonicalHost;
  });
  if (badHostLocs.length) {
    const hosts = [...new Set(badHostLocs.map(hostOf))];
    const anyBroken = hosts.some((h) => hostHealth.brokenHosts.includes(h));
    add(anyBroken ? 'CRITICAL' : 'WARNING', 'SITEMAP_WRONG_HOST',
      `${badHostLocs.length}/${locs.length} sitemap URLs use ${hosts.join(', ')} instead of ${canonicalHost}${anyBroken ? ' — that host does NOT serve 200, so every sitemap URL is dead for crawlers' : ''}`,
      { url, data: { hosts, sample: badHostLocs.slice(0, 5) } });
  } else {
    add('PASS', 'SITEMAP_HOST_OK', `all ${locs.length} sitemap URLs use ${canonicalHost}`, { url });
  }

  // every loc must serve 200 on the canonical host
  const toCheck = [...new Set(locs.map((l) => {
    const p = pathOf(l);
    return p === null ? l : `${base}${p}`;
  }))];
  const statuses = await pool(toCheck, async (u) => ({ u, r: await request(u, { method: 'HEAD' }) }), concurrency);
  let bad = 0;
  for (const s of statuses) {
    if (!s || s.__workerError) continue;
    const rec = { url: s.u, status: s.r.status, error: s.r.error, hops: s.r.hops };
    out.checked.push(rec);
    if (s.r.error || !s.r.ok) {
      bad++;
      add('CRITICAL', 'SITEMAP_URL_BAD',
        `sitemap URL ${pathOf(s.u)} -> ${s.r.error || `HTTP ${s.r.status}`} on ${canonicalHost}`,
        { url: s.u });
    }
  }
  if (bad === 0) {
    add('PASS', 'SITEMAP_URLS_OK',
      `all ${toCheck.length} sitemap URLs return 200 on ${canonicalHost}${soft404 ? ' (weak signal: the SPA catch-all answers 200 for unknown paths too — see SOFT_404)' : ''}`,
      { url });
  }

  // coverage vs live inventory
  const sitemapPaths = new Set(locs.map((l) => pathOf(l)).filter(Boolean));
  const missing = expectedPaths.filter((p) => !sitemapPaths.has(p));
  const stale = [...sitemapPaths].filter((p) => !expectedPaths.includes(p));
  out.missing = missing;
  out.extra = stale;
  if (missing.length) {
    add('CRITICAL', 'SITEMAP_MISSING_URL',
      `${missing.length} live URLs are absent from the sitemap: ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? ` (+${missing.length - 6})` : ''}`,
      { url, data: missing });
  } else {
    add('PASS', 'SITEMAP_COVERAGE', `sitemap covers all ${expectedPaths.length} live URLs`, { url });
  }
  if (stale.length) {
    add('WARNING', 'SITEMAP_STALE_URL',
      `${stale.length} sitemap URLs are not in the live inventory: ${stale.slice(0, 6).join(', ')}${stale.length > 6 ? ` (+${stale.length - 6})` : ''}`,
      { url, data: stale });
  }

  return out;
}

/** 7. robots.txt */
async function checkRobots(base, canonicalHost, crawlPaths, hostHealth) {
  const url = `${base}/robots.txt`;
  const res = await request(url);
  const out = { url, status: res.status, error: res.error, sitemaps: [], disallow: [] };

  if (res.error || !res.ok) {
    add('CRITICAL', 'ROBOTS_MISSING', `${url} -> ${res.error || `HTTP ${res.status}`}`, { url });
    return out;
  }
  add('PASS', 'ROBOTS_REACHABLE', `${url} returns 200`, { url });

  const lines = res.body.split(/\r?\n/).map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean);
  let inStarGroup = false;
  let sawGroup = false;
  for (const line of lines) {
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();
    if (field === 'user-agent') {
      sawGroup = true;
      inStarGroup = value === '*';
    } else if (field === 'disallow' && inStarGroup) {
      out.disallow.push(value);
    } else if (field === 'allow' && inStarGroup) {
      (out.allow || (out.allow = [])).push(value);
    } else if (field === 'sitemap') {
      out.sitemaps.push(value);
    }
  }
  if (!sawGroup) {
    add('WARNING', 'ROBOTS_NO_GROUP', `${url} declares no User-agent group`, { url });
  }

  if (out.disallow.includes('/')) {
    add('CRITICAL', 'ROBOTS_BLOCKS_CONTENT', `robots.txt has "Disallow: /" for User-agent: *`, {
      url,
    });
  } else {
    const allowed = out.allow || [];
    const blocked = crawlPaths.filter((p) =>
      out.disallow.some((d) => d && p.startsWith(d)) && !allowed.some((a) => a && p.startsWith(a))
    );
    if (blocked.length) {
      add('CRITICAL', 'ROBOTS_BLOCKS_CONTENT',
        `robots.txt blocks ${blocked.length} content URLs: ${blocked.slice(0, 5).join(', ')}`,
        { url, data: blocked });
    } else {
      add('PASS', 'ROBOTS_ALLOWS_CONTENT',
        `robots.txt does not block any of the ${crawlPaths.length} crawled content URLs`, { url });
    }
  }

  if (out.sitemaps.length === 0) {
    add('CRITICAL', 'ROBOTS_SITEMAP_MISSING', `robots.txt declares no Sitemap:`, { url });
  }
  for (const sm of out.sitemaps) {
    const h = hostOf(sm);
    if (h && h !== canonicalHost) {
      const broken = hostHealth.brokenHosts.includes(h);
      add(broken ? 'CRITICAL' : 'WARNING', 'METADATA_BROKEN_HOST',
        `robots.txt Sitemap: points at ${h}${broken ? ' which does NOT serve 200 — Google cannot fetch it' : ` instead of ${canonicalHost}`}`,
        { url, data: sm });
    }
    const probe = await request(sm, { method: 'GET' });
    out.sitemapChecks = out.sitemapChecks || [];
    out.sitemapChecks.push({ url: sm, status: probe.status, error: probe.error });
    if (probe.error || !probe.ok) {
      add('CRITICAL', 'ROBOTS_SITEMAP_UNREACHABLE',
        `robots.txt Sitemap: ${sm} -> ${probe.error || `HTTP ${probe.status}`}`, { url: sm });
    } else if (!h || h === canonicalHost) {
      add('PASS', 'ROBOTS_SITEMAP_OK', `robots.txt Sitemap: ${sm} returns 200`, { url: sm });
    }
  }

  return out;
}

/* ------------------------------------------------------------------ *
 * Reporting
 * ------------------------------------------------------------------ */

function truncate(s, n) {
  const str = String(s);
  return str.length <= n ? str : `${str.slice(0, n - 1)}…`;
}

const COLORS = process.stdout.isTTY && !process.env.NO_COLOR;
const c = {
  red: (s) => (COLORS ? `\x1b[31m${s}\x1b[0m` : s),
  yellow: (s) => (COLORS ? `\x1b[33m${s}\x1b[0m` : s),
  green: (s) => (COLORS ? `\x1b[32m${s}\x1b[0m` : s),
  dim: (s) => (COLORS ? `\x1b[2m${s}\x1b[0m` : s),
  bold: (s) => (COLORS ? `\x1b[1m${s}\x1b[0m` : s),
};

function groupFindings() {
  const groups = new Map();
  for (const f of findings) {
    const key = `${f.severity}::${f.code}`;
    if (!groups.has(key)) {
      groups.set(key, { severity: f.severity, code: f.code, fix: f.fix, count: 0, items: [] });
    }
    const g = groups.get(key);
    g.count++;
    g.items.push({ url: f.url, message: f.message, data: f.data });
    if (!g.fix && f.fix) g.fix = f.fix;
  }
  return [...groups.values()].sort(
    (a, b) => SEVERITY[a.severity] - SEVERITY[b.severity] || b.count - a.count
  );
}

function printReport(groups, meta) {
  const line = (s = '') => console.log(s);
  line();
  line(c.bold('══ Technical SEO audit ══════════════════════════════════════════'));
  line(`  base            ${meta.base}`);
  line(`  canonical host  ${meta.canonicalHost}`);
  line(`  URLs crawled    ${meta.urlsCrawled}${meta.urlsSkipped ? c.dim(` (+${meta.urlsSkipped} skipped by --limit)`) : ''}`);
  line(`  duration        ${(meta.durationMs / 1000).toFixed(1)}s`);
  line();

  const counts = { CRITICAL: 0, WARNING: 0, PASS: 0 };
  for (const g of groups) counts[g.severity] += g.count;

  line(
    `  ${c.red(`CRITICAL ${counts.CRITICAL}`)}   ${c.yellow(`WARNING ${counts.WARNING}`)}   ${c.green(`PASS ${counts.PASS}`)}`
  );

  for (const sev of ['CRITICAL', 'WARNING', 'PASS']) {
    const inSev = groups.filter((g) => g.severity === sev);
    if (!inSev.length) continue;
    const paint = sev === 'CRITICAL' ? c.red : sev === 'WARNING' ? c.yellow : c.green;
    line();
    line(paint(c.bold(`── ${sev} (${counts[sev]}) ${'─'.repeat(Math.max(0, 46 - sev.length))}`)));
    for (const g of inSev) {
      line();
      line(`  ${paint('●')} ${c.bold(g.code)} ${c.dim(`× ${g.count}`)}`);
      const sample = sev === 'PASS' ? g.items.slice(0, 3) : g.items.slice(0, 8);
      for (const it of sample) line(`      ${truncate(it.message, 150)}`);
      if (g.items.length > sample.length) {
        line(c.dim(`      … and ${g.items.length - sample.length} more`));
      }
      if (g.fix && sev !== 'PASS') line(c.dim(`      fix: ${g.fix}`));
    }
  }

  line();
  if (counts.CRITICAL) {
    line(c.red(c.bold(`✖ ${counts.CRITICAL} CRITICAL finding(s) — exiting 1`)));
  } else {
    line(c.green(c.bold('✔ no CRITICAL findings')));
  }
  line();
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`audit: ${e.message}\n\n${HELP}`);
    process.exit(2);
  }
  DELAY = opts.delay;

  const started = Date.now();
  const base = opts.base;
  const canonicalHost = hostOf(base);

  if (!opts.json) console.log(c.dim(`crawling ${base} …`));

  // 2. host health first — everything else is judged against it
  const hostHealth = await checkHosts(base);

  // inventory
  const inventory = await loadInventory(base);
  for (const err of inventory.apiErrors) {
    add('CRITICAL', 'API_UNREACHABLE', err, { url: `${base}/api/public/blog-posts` });
  }
  if (inventory.posts.length) {
    add('PASS', 'API_OK',
      `public API lists ${inventory.posts.length} blog posts and ${inventory.courses.length} courses`);
  }

  const allEntries = buildUrlList(base, inventory);
  const entries = allEntries.slice(0, opts.limit === Infinity ? allEntries.length : opts.limit);
  const skipped = allEntries.length - entries.length;

  // 1/3/4/5/8
  const pages = await crawlPages(entries, {
    canonicalHost,
    hostHealth,
    concurrency: opts.concurrency,
  });

  // attach source records for the content-presence check
  const byRoute = new Map(entries.map((e) => [e.route, e]));
  for (const p of pages) {
    const e = byRoute.get(p.route);
    if (!e) continue;
    if (e.kind === 'post') p.__post = e.meta;
    if (e.kind === 'course') p.__course = e.meta;
  }
  const shellText = checkContentAndDuplicates(pages, canonicalHost);
  for (const p of pages) {
    delete p.__post;
    delete p.__course;
  }

  // soft-404 probe (SPA catch-all rewrite)
  const soft404 = await checkSoft404(base, shellText ?? null);

  const expectedPaths = allEntries.map((e) => (e.route === '/' ? '/' : e.route));
  const crawlPathsForRobots = entries.map((e) => e.route);

  // 6 + 7
  const sitemap = await checkSitemap(
    base, canonicalHost, expectedPaths, hostHealth, opts.concurrency, soft404.soft404
  );
  const robots = await checkRobots(base, canonicalHost, crawlPathsForRobots, hostHealth);

  const durationMs = Date.now() - started;
  const groups = groupFindings();
  const counts = { CRITICAL: 0, WARNING: 0, PASS: 0 };
  for (const f of findings) counts[f.severity]++;

  const report = {
    generatedAt: new Date().toISOString(),
    base,
    canonicalHost,
    durationMs,
    options: { limit: opts.limit === Infinity ? null : opts.limit, concurrency: opts.concurrency, delay: opts.delay },
    summary: {
      critical: counts.CRITICAL,
      warning: counts.WARNING,
      pass: counts.PASS,
      urlsCrawled: entries.length,
      urlsSkipped: skipped,
      postsInApi: inventory.posts.length,
      coursesInApi: inventory.courses.length,
    },
    hosts: hostHealth.hosts,
    brokenHosts: hostHealth.brokenHosts,
    soft404,
    sitemap,
    robots,
    pages,
    findings: groups,
  };

  if (opts.writeReport) {
    try {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
      fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);
    } catch (e) {
      console.error(`audit: could not write ${REPORT_FILE}: ${e.message}`);
    }
  }

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(groups, {
      base,
      canonicalHost,
      urlsCrawled: entries.length,
      urlsSkipped: skipped,
      durationMs,
    });
    if (opts.writeReport) console.log(c.dim(`  report: ${path.relative(process.cwd(), REPORT_FILE)}\n`));
  }

  process.exit(counts.CRITICAL > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(`audit: fatal: ${e && e.stack ? e.stack : e}`);
  process.exit(2);
});
