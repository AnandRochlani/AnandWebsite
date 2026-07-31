#!/usr/bin/env node
/**
 * IndexNow submission for anandrochlani.com.
 *
 * IndexNow is the official open protocol (indexnow.org) supported by Bing, Yandex,
 * Naver and Seznam: you POST the URLs you changed and the engines pull them.
 * Google does NOT participate — for Google use Search Console (see gsc-setup.md).
 *
 * DRY RUN IS THE DEFAULT. Nothing is ever submitted without --yes.
 *
 *   node seo-pipeline/indexing/indexnow.mjs --help
 *
 * Node 18+ ESM, zero npm dependencies.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  SITE, CANONICAL_HOST, PUBLIC_DIR, KEY_FILE, HISTORY_FILE,
  c, log, warn, fail, ok, rel,
  parseArgs, readJson, writeJson,
  toCanonicalUrl, isoDay, sha256, daysAgo,
  fetchWithTimeout, fetchSitemap, fetchPosts, postToEntry,
} from './lib.mjs';

const ENDPOINT = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow';
const BATCH_SIZE = 10_000;         // protocol maximum per request
const DEFAULT_DAYS = 7;

/* ------------------------------------------------------------------ *
 * help
 * ------------------------------------------------------------------ */
const HELP = `
${c.bold('indexnow.mjs')} — submit URLs to IndexNow (Bing / Yandex / Naver / Seznam)

${c.bold('USAGE')}
  node seo-pipeline/indexing/indexnow.mjs <mode> [options]

${c.bold('MODES')} (pick one; --new is the default)
  --new              URLs whose lastmod/date is within --days (default ${DEFAULT_DAYS})
  --all              every canonical URL found in the sitemap (+ blog API)
  --urls <a,b,c>     explicit comma-separated URLs or paths (/blog/my-post)

${c.bold('OPTIONS')}
  --days <n>         freshness window for --new (default ${DEFAULT_DAYS})
  --dry-run          print what would be sent and exit  ${c.green('[DEFAULT]')}
  --yes              actually POST to ${ENDPOINT}
  --force            ignore submission history and resubmit unchanged URLs
  --skip-key-check   do not verify the key file is live before submitting
  --source <s>       url source: sitemap | api | both   (default: both)
  --sitemap <url>    override sitemap URL (default ${SITE}/sitemap.xml)
  --endpoint <url>   override the IndexNow endpoint
  --json             machine-readable summary on stdout
  --help             this text

${c.bold('EXAMPLES')}
  node seo-pipeline/indexing/indexnow.mjs --new                 # dry run, last 7 days
  node seo-pipeline/indexing/indexnow.mjs --new --days 30
  node seo-pipeline/indexing/indexnow.mjs --all --yes           # real submit, everything
  node seo-pipeline/indexing/indexnow.mjs --urls /blog/foo --yes
  node seo-pipeline/indexing/indexnow.mjs --all --force --yes   # resubmit unchanged too

${c.bold('STATE FILES')}
  ${rel(KEY_FILE).padEnd(42)}persistent API key (commit this)
  ${rel(HISTORY_FILE).padEnd(42)}submission history, prevents spam (commit this)
  ${'public/<key>.txt'.padEnd(42)}key verification file (commit + deploy this)

${c.dim('Canonical host is the APEX ' + CANONICAL_HOST + '. www.' + CANONICAL_HOST + ' has a broken TLS')}
${c.dim('certificate and IndexNow rejects (422) any URL whose host differs from `host`.')}
`;

/* ------------------------------------------------------------------ *
 * key management
 * ------------------------------------------------------------------ */
/**
 * Load (or create on first run) the persistent IndexNow key.
 * Also (re)writes public/<key>.txt, which must contain exactly the key.
 */
function loadOrCreateKey() {
  let state = readJson(KEY_FILE);
  let created = false;

  if (!state || typeof state.key !== 'string' || !/^[a-f0-9]{32}$/.test(state.key)) {
    state = {
      key: crypto.randomBytes(16).toString('hex'), // 32 hex chars
      host: CANONICAL_HOST,
      createdAt: new Date().toISOString(),
      note: 'IndexNow API key. Keep this file — regenerating the key invalidates the deployed public/<key>.txt.',
    };
    writeJson(KEY_FILE, state);
    created = true;
  }

  const keyLocation = `${SITE}/${state.key}.txt`;
  const keyFilePath = path.join(PUBLIC_DIR, `${state.key}.txt`);

  // Remove stale key files from previous keys so only one is ever deployed.
  let stale = [];
  try {
    stale = fs.readdirSync(PUBLIC_DIR).filter((f) => /^[a-f0-9]{32}\.txt$/.test(f) && f !== `${state.key}.txt`);
  } catch { /* public/ missing — created below */ }

  let wroteKeyFile = false;
  if (!fs.existsSync(keyFilePath) || fs.readFileSync(keyFilePath, 'utf8').trim() !== state.key) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(keyFilePath, `${state.key}\n`, 'utf8');
    wroteKeyFile = true;
  }

  return { ...state, keyLocation, keyFilePath, created, wroteKeyFile, stale };
}

/** Verify the key file is actually live on the canonical host. */
async function verifyKeyLive(keyLocation, key) {
  try {
    const res = await fetchWithTimeout(keyLocation, { headers: { 'user-agent': 'anandrochlani-indexing/1.0' } }, 15_000);
    if (!res.ok) return { live: false, reason: `HTTP ${res.status} for ${keyLocation}` };
    const body = (await res.text()).trim();
    if (body !== key) {
      return { live: false, reason: `${keyLocation} served content that is not the key (got ${JSON.stringify(body.slice(0, 60))})` };
    }
    return { live: true, reason: 'key file is live and matches' };
  } catch (e) {
    return { live: false, reason: `request failed: ${e.message}` };
  }
}

/* ------------------------------------------------------------------ *
 * url collection
 * ------------------------------------------------------------------ */
/**
 * Build the candidate set from the sitemap and/or the public blog API.
 * Returns Map<url, {url, lastmod, contentHash, sources:[]}>
 */
async function collectUrls({ source }) {
  const map = new Map();
  const notes = [];

  const upsert = (url, patch, src) => {
    if (!url) return;
    const prev = map.get(url) || { url, lastmod: null, contentHash: null, sources: [] };
    map.set(url, {
      ...prev,
      ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v != null)),
      sources: prev.sources.includes(src) ? prev.sources : [...prev.sources, src],
    });
  };

  if (source === 'sitemap' || source === 'both') {
    try {
      const sm = await fetchSitemap(process.env.SITEMAP_URL || `${SITE}/sitemap.xml`);
      let offHost = 0;
      let wwwFixed = 0;
      for (const e of sm.entries) {
        if (!e.loc) { offHost++; continue; }
        if (/\/\/www\./.test(e.rawLoc)) wwwFixed++;
        upsert(e.loc, { lastmod: isoDay(e.lastmod) }, 'sitemap');
      }
      notes.push(`sitemap: ${sm.entries.length} <url> entries`);
      if (wwwFixed) {
        notes.push(`sitemap: ${wwwFixed} URL(s) used the www host and were rewritten to the apex ${CANONICAL_HOST}`);
      }
      if (offHost) notes.push(`sitemap: ${offHost} URL(s) skipped (different site / unparseable)`);
      for (const w of sm.warnings) notes.push(`sitemap: ${w}`);
    } catch (e) {
      notes.push(`sitemap: UNAVAILABLE (${e.message})`);
    }
  }

  if (source === 'api' || source === 'both') {
    try {
      const posts = await fetchPosts();
      for (const p of posts) {
        const entry = postToEntry(p);
        if (!entry) continue;
        upsert(entry.url, { lastmod: entry.date, contentHash: entry.contentHash }, 'api');
      }
      notes.push(`blog API: ${posts.length} post(s)`);
      if (source === 'api') {
        // The API only knows about posts — add the evergreen hub pages.
        const today = isoDay(new Date());
        for (const p of ['/', '/blog', '/courses']) upsert(`${SITE}${p === '/' ? '/' : p}`, { lastmod: today }, 'api');
      }
    } catch (e) {
      notes.push(`blog API: UNAVAILABLE (${e.message})`);
    }
  }

  return { map, notes };
}

/** Turn --urls values (absolute URLs or site-relative paths) into canonical URLs. */
function parseExplicitUrls(value) {
  const out = [];
  const bad = [];
  for (const raw of String(value).split(',').map((s) => s.trim()).filter(Boolean)) {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `${SITE}${raw.startsWith('/') ? '' : '/'}${raw}`;
    const url = toCanonicalUrl(candidate);
    if (url) out.push({ url, lastmod: isoDay(new Date()), contentHash: null, sources: ['explicit'] });
    else bad.push(raw);
  }
  return { entries: out, bad };
}

/* ------------------------------------------------------------------ *
 * history
 * ------------------------------------------------------------------ */
function loadHistory() {
  const h = readJson(HISTORY_FILE);
  if (h && typeof h === 'object' && h.entries) return h;
  return { host: CANONICAL_HOST, endpoint: ENDPOINT, entries: {} };
}

/** Signature that decides "has this URL changed since we last told the engines?" */
function signature(entry) {
  return sha256(`${entry.lastmod || 'no-lastmod'}|${entry.contentHash || 'no-content-hash'}`).slice(0, 16);
}

/* ------------------------------------------------------------------ *
 * response handling
 * ------------------------------------------------------------------ */
const RESPONSES = {
  200: {
    label: 'OK',
    meaning: 'URLs submitted successfully. The engines have accepted them and will crawl on their own schedule (minutes to days). Submission is not a guarantee of indexing.',
    fatal: false,
  },
  202: {
    label: 'Accepted — key validation pending',
    meaning: `The URLs were accepted but the engine has not yet verified your key file. Make sure ${'`public/<key>.txt`'} is deployed and reachable, then re-run later. A 202 usually turns into 200 once the key file has been fetched.`,
    fatal: false,
  },
  400: {
    label: 'Bad request',
    meaning: 'Invalid JSON body or malformed URL(s). Check that every URL is absolute, https, and well-formed, and that the body has host/key/keyLocation/urlList.',
    fatal: true,
  },
  403: {
    label: 'Forbidden — key not valid',
    meaning: `The engine could not fetch or match the key file. Verify ${'`<keyLocation>`'} returns HTTP 200 with exactly the key as its body (no HTML, no SPA fallback page), then retry.`,
    fatal: true,
  },
  422: {
    label: 'Unprocessable — URLs do not belong to the host',
    meaning: `Every URL in urlList must be on the same host as ${'`host`'}. Mixing ${'`www.` and the apex domain'} triggers this. Also returned when the key does not match the schema.`,
    fatal: true,
  },
  429: {
    label: 'Too many requests',
    meaning: 'Rate limited (potential spam). Back off, submit fewer URLs less often, and only submit URLs that actually changed.',
    fatal: true,
  },
};

function explainStatus(status) {
  const info = RESPONSES[status];
  if (info) return info;
  if (status >= 500) {
    return { label: 'Server error at the IndexNow endpoint', meaning: 'Transient problem on the search engine side. Retry later; nothing is wrong with your setup.', fatal: true };
  }
  return { label: `Unexpected status ${status}`, meaning: 'Not part of the documented IndexNow response set. Inspect the response body below.', fatal: true };
}

/* ------------------------------------------------------------------ *
 * main
 * ------------------------------------------------------------------ */
async function main() {
  const args = parseArgs(process.argv.slice(2), ['days', 'urls', 'source', 'sitemap', 'endpoint']);
  if (args.help || args.h) { log(HELP); return 0; }

  const endpoint = typeof args.endpoint === 'string' ? args.endpoint : ENDPOINT;
  const submit = args.yes === true && args['dry-run'] !== true;
  const force = args.force === true;
  const days = Number(args.days ?? DEFAULT_DAYS);
  if (!Number.isFinite(days) || days <= 0) { fail('--days must be a positive number'); return 2; }

  const source = typeof args.source === 'string' ? args.source : 'both';
  if (!['sitemap', 'api', 'both'].includes(source)) { fail(`--source must be sitemap|api|both (got ${source})`); return 2; }
  if (args.sitemap && typeof args.sitemap === 'string') process.env.SITEMAP_URL = args.sitemap;

  const modes = [args.all && 'all', args.new && 'new', args.urls && 'urls'].filter(Boolean);
  if (modes.length > 1) { fail(`Pick ONE mode, got: ${modes.map((m) => `--${m}`).join(' ')}`); return 2; }
  const mode = modes[0] || 'new';

  log(c.bold(`\nIndexNow · ${CANONICAL_HOST}`));
  log(c.dim(`mode=${mode}  endpoint=${endpoint}  ${submit ? c.yellow('LIVE SUBMIT') : c.green('DRY RUN (default) — add --yes to submit')}`));
  log('');

  /* --- 1. key ---------------------------------------------------- */
  const key = loadOrCreateKey();
  if (key.created) ok(`Generated a new IndexNow key and wrote ${rel(KEY_FILE)}`);
  if (key.wroteKeyFile) ok(`Wrote key verification file ${rel(key.keyFilePath)}`);
  if (key.stale.length) {
    warn(`Stale key files still in public/: ${key.stale.join(', ')} — delete them (they are not used).`);
  }
  log(`  key         ${key.key}`);
  log(`  keyLocation ${key.keyLocation}`);
  if (key.created || key.wroteKeyFile) {
    warn(`Commit and deploy ${rel(key.keyFilePath)} BEFORE submitting, or the engines return 403.`);
  }

  /* --- 2. collect ------------------------------------------------ */
  let candidates = [];
  let notes = [];
  if (mode === 'urls') {
    const { entries, bad } = parseExplicitUrls(args.urls);
    candidates = entries;
    for (const b of bad) warn(`--urls: skipped ${JSON.stringify(b)} (not on ${CANONICAL_HOST})`);
  } else {
    const res = await collectUrls({ source });
    notes = res.notes;
    candidates = [...res.map.values()];
  }
  log('');
  for (const n of notes) log(`  ${c.dim('·')} ${n}`);
  if (!candidates.length) { fail('No URLs collected. Nothing to do.'); return 1; }
  log(`  ${c.dim('·')} ${candidates.length} canonical URL(s) in scope`);

  /* --- 3. filter by mode ----------------------------------------- */
  let selected = candidates;
  if (mode === 'new') {
    const before = selected.length;
    selected = selected.filter((e) => e.lastmod && daysAgo(e.lastmod) <= days);
    log(`  ${c.dim('·')} --new: ${selected.length}/${before} URL(s) modified within ${days} day(s)`);
  }

  /* --- 4. filter by history -------------------------------------- */
  const history = loadHistory();
  const skipped = [];
  const toSend = [];
  for (const e of selected) {
    const sig = signature(e);
    const prev = history.entries[e.url];
    if (!force && prev && prev.signature === sig) {
      skipped.push({ ...e, signature: sig, lastSubmittedAt: prev.lastSubmittedAt });
    } else {
      toSend.push({ ...e, signature: sig, previouslySubmittedAt: prev?.lastSubmittedAt || null });
    }
  }
  if (skipped.length) {
    log(`  ${c.dim('·')} ${skipped.length} URL(s) unchanged since last submission — skipped (use --force to resubmit)`);
  }

  if (!toSend.length) {
    log('');
    if (!selected.length) {
      ok(`Nothing to submit: no URL in scope was modified within the last ${days} day(s). Try --days <n> or --all.`);
    } else {
      ok('Nothing new to submit: every URL in scope was already submitted with the same lastmod/content hash. Use --force to resubmit.');
    }
    if (args.json) log(JSON.stringify({ mode, submitted: false, wouldSend: 0, skipped: skipped.length }, null, 2));
    return 0;
  }

  /* --- 5. show the payload --------------------------------------- */
  const urlList = toSend.map((e) => e.url);
  const batches = [];
  for (let i = 0; i < urlList.length; i += BATCH_SIZE) batches.push(urlList.slice(i, i + BATCH_SIZE));

  log('');
  log(c.bold(`Payload — ${urlList.length} URL(s) in ${batches.length} batch(es) of max ${BATCH_SIZE.toLocaleString('en-US')}:`));
  log('');
  const preview = toSend.slice(0, 25);
  for (const e of preview) {
    const flags = [e.lastmod || 'no-lastmod', e.sources.join('+'), e.previouslySubmittedAt ? 'changed' : 'never-submitted'];
    log(`  ${e.url}  ${c.dim(`[${flags.join(' · ')}]`)}`);
  }
  if (toSend.length > preview.length) log(c.dim(`  … and ${toSend.length - preview.length} more`));

  log('');
  log(c.bold(`POST ${endpoint}`));
  log(c.dim('Content-Type: application/json; charset=utf-8'));
  log(JSON.stringify(
    { host: CANONICAL_HOST, key: key.key, keyLocation: key.keyLocation, urlList: batches[0].slice(0, 3).concat(batches[0].length > 3 ? [`… ${batches[0].length - 3} more`] : []) },
    null, 2,
  ));

  /* --- 6. key preflight ------------------------------------------ */
  let keyCheck = { live: null, reason: 'not checked' };
  if (!args['skip-key-check']) {
    log('');
    keyCheck = await verifyKeyLive(key.keyLocation, key.key);
    if (keyCheck.live) ok(`Key preflight: ${keyCheck.reason}`);
    else warn(`Key preflight FAILED: ${keyCheck.reason}`);
  }

  /* --- 7. dry run stops here ------------------------------------- */
  if (!submit) {
    log('');
    log(c.green('DRY RUN — nothing was submitted.'));
    log(`Re-run with ${c.bold('--yes')} to actually submit these ${urlList.length} URL(s).`);
    if (args.json) {
      log(JSON.stringify({ mode, submitted: false, wouldSend: urlList.length, batches: batches.length, skipped: skipped.length, keyLive: keyCheck.live, urls: urlList }, null, 2));
    }
    return 0;
  }

  if (keyCheck.live === false) {
    log('');
    fail('Refusing to submit: the key verification file is not live on the canonical host.');
    log(`  Deploy ${rel(key.keyFilePath)} so that ${key.keyLocation} returns exactly the key,`);
    log('  then re-run. Override with --skip-key-check if you know the deploy is in flight.');
    return 1;
  }

  /* --- 8. submit -------------------------------------------------- */
  let anyFatal = false;
  let anyAccepted = false;
  const results = [];
  for (const [i, batch] of batches.entries()) {
    const body = JSON.stringify({ host: CANONICAL_HOST, key: key.key, keyLocation: key.keyLocation, urlList: batch });
    log('');
    log(c.bold(`Submitting batch ${i + 1}/${batches.length} (${batch.length} URLs)…`));

    let status; let text = '';
    try {
      const res = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8', 'user-agent': 'anandrochlani-indexing/1.0' },
        body,
      }, 30_000);
      status = res.status;
      text = (await res.text()).slice(0, 500);
    } catch (e) {
      fail(`Network error: ${e.message}`);
      results.push({ batch: i + 1, status: 0, error: e.message });
      anyFatal = true;
      continue;
    }

    const info = explainStatus(status);
    const line = `HTTP ${status} — ${info.label}`;
    if (info.fatal) fail(line); else ok(line);
    log(`  ${info.meaning}`);
    if (text.trim()) log(c.dim(`  response body: ${text.trim()}`));
    results.push({ batch: i + 1, status, label: info.label });

    if (info.fatal) { anyFatal = true; continue; }

    // Record only the URLs the engines accepted (200/202).
    anyAccepted = true;
    const now = new Date().toISOString();
    for (const e of toSend.filter((x) => batch.includes(x.url))) {
      const prev = history.entries[e.url];
      history.entries[e.url] = {
        signature: e.signature,
        lastmod: e.lastmod || null,
        contentHash: e.contentHash || null,
        lastSubmittedAt: now,
        lastStatus: status,
        submissions: (prev?.submissions || 0) + 1,
      };
    }
  }

  log('');
  if (anyAccepted) {
    history.host = CANONICAL_HOST;
    history.endpoint = endpoint;
    history.updatedAt = new Date().toISOString();
    writeJson(HISTORY_FILE, history);
    ok(`Updated ${rel(HISTORY_FILE)}`);
  } else {
    warn(`Nothing was accepted — ${rel(HISTORY_FILE)} left unchanged so a retry resubmits these URLs.`);
  }
  log(c.dim('Note: Google does not support IndexNow. Use Search Console — see seo-pipeline/indexing/gsc-setup.md'));

  if (args.json) log(JSON.stringify({ mode, submitted: true, sent: urlList.length, batches: results }, null, 2));
  return anyFatal ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => { fail(e.stack || e.message); process.exit(1); });
