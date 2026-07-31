/**
 * Shared helpers for the backlinks module. Node built-ins only, zero npm deps.
 *
 * Nothing in here sends anything anywhere. `httpGet` performs read-only GETs
 * (used by monitor.mjs to verify links we already earned).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SEO_ROOT = path.dirname(HERE);
export const REPO_ROOT = path.dirname(SEO_ROOT);

export const PROSPECTS_FILE = path.join(HERE, 'prospects.json');
export const PIPELINE_FILE = path.join(HERE, 'pipeline.json');
export const TEMPLATES_DIR = path.join(HERE, 'templates');
export const DRAFTS_DIR = path.join(HERE, 'drafts');
export const REPORTS_DIR = path.join(SEO_ROOT, 'reports');
export const MONITOR_REPORT = path.join(REPORTS_DIR, 'backlinks-monitor.json');

/**
 * APEX is canonical. www.anandrochlani.com has a broken TLS certificate —
 * never hand a www URL to anyone, and flag it if an earned link uses one.
 */
export const SITE = {
  canonical: 'https://anandrochlani.com',
  host: 'anandrochlani.com',
  badHost: 'www.anandrochlani.com',
  author: 'Anand Rochlani',
  youtube: 'https://www.youtube.com/@anandrochlani5226',
  course: 'System Design Fundamentals for Interviews',
  courseUrl:
    'https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73',
};

export const USER_AGENT =
  'anandrochlani-backlink-monitor/1.0 (+https://anandrochlani.com; link health check; contact via site)';

/* ------------------------------------------------------------------ state */

export const STATES = [
  'identified',
  'researched',
  'contacted',
  'replied',
  'won',
  'lost',
  'nurture',
];

/** Allowed transitions. Anything else needs --force. */
export const TRANSITIONS = {
  identified: ['researched', 'contacted', 'lost', 'nurture'],
  researched: ['contacted', 'lost', 'nurture', 'identified'],
  contacted: ['replied', 'won', 'lost', 'nurture'],
  replied: ['won', 'lost', 'nurture', 'contacted'],
  won: ['lost', 'nurture'],
  lost: ['nurture', 'researched', 'identified'],
  nurture: ['researched', 'contacted', 'lost'],
};

export const DEFAULT_CONFIG = {
  followUpDays: 7, // wait this long before a follow-up is due
  maxFollowUps: 2, // hard cap; after the last one lapses, auto-move to lost
  researchStaleDays: 30, // researched-but-never-contacted nag
};

/* -------------------------------------------------------------------- io */

export function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT' && fallback !== null) return structuredClone(fallback);
    if (e.code === 'ENOENT') return null;
    throw new Error(`could not parse ${path.relative(REPO_ROOT, file)}: ${e.message}`);
  }
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function loadProspects() {
  const p = readJson(PROSPECTS_FILE);
  if (!p) throw new Error(`missing ${path.relative(REPO_ROOT, PROSPECTS_FILE)}`);
  return p;
}

export function emptyPipeline() {
  return {
    version: 1,
    note: 'Outreach state. Managed by outreach.mjs — safe to hand-edit, keep the shape.',
    updated: nowISO(),
    config: { ...DEFAULT_CONFIG },
    entries: [],
  };
}

export function loadPipeline() {
  const p = readJson(PIPELINE_FILE, emptyPipeline());
  p.config = { ...DEFAULT_CONFIG, ...(p.config || {}) };
  p.entries = p.entries || [];
  return p;
}

export function savePipeline(pipeline) {
  pipeline.updated = nowISO();
  writeJson(PIPELINE_FILE, pipeline);
}

/* ------------------------------------------------------------------ time */

export function nowISO() {
  return new Date().toISOString();
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso, days) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

/** Whole days from `iso` until now (negative = in the future). */
export function daysSince(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / 86400000);
}

export function fmtDate(iso) {
  return iso ? String(iso).slice(0, 10) : '—';
}

/* ------------------------------------------------------------------ args */

/**
 * Minimal argv parser. Supports `--key value`, `--key=value`, `--bool`,
 * and short `-h`. Flags named in `booleans` never swallow the next token.
 */
export function parseArgs(argv, { booleans = [] } = {}) {
  const bools = new Set([...booleans, 'help', 'h', 'json', 'quiet', 'force', 'all']);
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
      rest.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq !== -1) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
        continue;
      }
      const key = a.slice(2);
      if (bools.has(key)) {
        flags[key] = true;
        continue;
      }
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) flags[key] = true;
      else {
        flags[key] = next;
        i++;
      }
      continue;
    }
    if (a === '-h') {
      flags.help = true;
      continue;
    }
    rest.push(a);
  }
  return { _: rest, flags };
}

export function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/* ----------------------------------------------------------------- print */

const TTY = process.stdout.isTTY && !process.env.NO_COLOR;
const wrap = (code) => (s) => (TTY ? `[${code}m${s}[0m` : String(s));
export const c = {
  bold: wrap(1),
  dim: wrap(2),
  red: wrap(31),
  green: wrap(32),
  yellow: wrap(33),
  blue: wrap(34),
  magenta: wrap(35),
  cyan: wrap(36),
};

export function pad(s, n) {
  const str = String(s ?? '');
  return str.length >= n ? str.slice(0, n) : str + ' '.repeat(n - str.length);
}

export function truncate(s, n) {
  const str = String(s ?? '');
  return str.length <= n ? str : `${str.slice(0, n - 1)}…`;
}

export function table(rows, headers) {
  if (!rows.length) return;
  const cols = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i] ?? '').length))
  );
  console.log(c.dim(headers.map((h, i) => pad(h, cols[i])).join('  ')));
  for (const r of rows) console.log(r.map((v, i) => pad(v, cols[i])).join('  '));
}

/* ------------------------------------------------------------------ http */

/**
 * Polite read-only GET with timeout. Returns { ok, status, url, body, error }.
 * Never posts, never authenticates, never follows anything but redirects.
 */
export async function httpGet(url, { timeoutMs = 20000, maxBytes = 2_000_000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en',
      },
    });
    let body = '';
    if (res.ok) {
      const text = await res.text();
      body = text.length > maxBytes ? text.slice(0, maxBytes) : text;
    }
    return { ok: res.ok, status: res.status, url: res.url || url, body, error: null };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      url,
      body: '',
      error: e.name === 'AbortError' ? `timeout after ${timeoutMs}ms` : e.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ html */

/**
 * Extract every <a> in `html` whose href points at `host`.
 * Returns [{ href, absolute, anchor, rel, follow, target }].
 * Deliberately a tolerant regex scan rather than a real parser — we only need
 * anchors, and pulling in a DOM library would break the zero-dependency rule.
 */
export function findLinksTo(html, host, pageUrl) {
  const out = [];
  if (!html) return out;
  const anchorRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = anchorRe.exec(html)) !== null) {
    const attrs = m[1];
    const href = attr(attrs, 'href');
    if (!href) continue;
    let absolute;
    try {
      absolute = new URL(href, pageUrl).toString();
    } catch {
      continue;
    }
    let hostname;
    try {
      hostname = new URL(absolute).hostname.toLowerCase();
    } catch {
      continue;
    }
    if (hostname !== host && hostname !== `www.${host}` && !hostname.endsWith(`.${host}`)) continue;
    const rel = (attr(attrs, 'rel') || '').toLowerCase().trim();
    const relTokens = rel ? rel.split(/\s+/) : [];
    out.push({
      href,
      absolute,
      hostname,
      anchor: stripTags(m[2]).trim().replace(/\s+/g, ' ').slice(0, 200),
      rel: rel || null,
      relTokens,
      follow: !relTokens.some((t) => t === 'nofollow' || t === 'ugc' || t === 'sponsored'),
      target: attr(attrs, 'target') || null,
    });
  }
  return out;
}

function attr(attrs, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const m = attrs.match(re);
  if (!m) return null;
  return decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
}

function stripTags(s) {
  return decodeEntities(s.replace(/<[^>]*>/g, ' '));
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/** Detect meta robots noindex on the linking page — a noindexed page passes nothing. */
export function hasNoindex(html) {
  if (!html) return false;
  const m = html.match(/<meta\b[^>]*name\s*=\s*["']?robots["']?[^>]*>/i);
  if (!m) return false;
  return /noindex/i.test(m[0]);
}

export function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
