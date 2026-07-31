#!/usr/bin/env node
/**
 * Publish article drafts from seo-pipeline/articles/ to the live blog.
 *
 * Usage:
 *   ADMIN_USERNAME=... ADMIN_PASSWORD=... node seo-pipeline/publish.mjs           # dry run (plan only)
 *   ADMIN_USERNAME=... ADMIN_PASSWORD=... node seo-pipeline/publish.mjs --yes     # actually publish
 *   ... node seo-pipeline/publish.mjs --yes articles/10-*.json                    # specific drafts only
 *
 * Idempotent by slug: a draft whose slug already exists live becomes a PUT (update),
 * otherwise a POST (create). Run qa.mjs first — publish refuses drafts that fail QA.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runQa } from './qa.mjs';

const SITE = (process.env.SITE_URL || 'https://anandrochlani.com').replace(/\/$/, '');
const USER = process.env.ADMIN_USERNAME;
const PASS = process.env.ADMIN_PASSWORD;

const argv = process.argv.slice(2);
const YES = argv.includes('--yes');
const fileArgs = argv.filter((a) => a !== '--yes');

const here = path.dirname(fileURLToPath(import.meta.url));
const articlesDir = path.join(here, 'articles');

function loadDrafts() {
  const files = fileArgs.length
    ? fileArgs.map((f) => path.resolve(f))
    : fs
        .readdirSync(articlesDir)
        .filter((f) => f.endsWith('.json'))
        .sort()
        .map((f) => path.join(articlesDir, f));
  return files.map((file) => ({ file, draft: JSON.parse(fs.readFileSync(file, 'utf8')) }));
}

async function api(pathname, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${SITE}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON error body */
  }
  return { res, json, text };
}

async function login() {
  if (!USER || !PASS) {
    console.error('Missing ADMIN_USERNAME / ADMIN_PASSWORD env vars.');
    console.error('These are the same credentials configured in Vercel project env.');
    process.exit(1);
  }
  const { res, json } = await api('/api/admin/login', {
    method: 'POST',
    body: { username: USER, password: PASS },
  });
  if (!res.ok) {
    console.error(`Login failed (${res.status}):`, json?.error || '');
    process.exit(1);
  }
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    console.error('Login succeeded but no session cookie returned.');
    process.exit(1);
  }
  return setCookie.split(';')[0];
}

async function main() {
  const drafts = loadDrafts();
  if (!drafts.length) {
    console.log('No drafts found in seo-pipeline/articles/.');
    return;
  }

  const qa = await runQa(drafts.map((d) => d.file));
  if (!qa.ok) {
    console.error('\nQA failed — fix the issues above before publishing.');
    process.exit(1);
  }

  const { res: liveRes, json: liveJson } = await api('/api/public/blog-posts');
  if (!liveRes.ok) {
    console.error(`Could not fetch live posts (${liveRes.status}).`);
    process.exit(1);
  }
  const liveBySlug = new Map((liveJson.posts || []).map((p) => [p.slug, p]));

  const plan = drafts.map(({ file, draft }) => {
    const existing = liveBySlug.get(draft.slug);
    return { file, draft, action: existing ? 'UPDATE' : 'CREATE', existingId: existing?.id ?? null };
  });

  console.log(`\nPublish plan → ${SITE}`);
  for (const p of plan) {
    console.log(
      `  ${p.action}${p.existingId ? ` (id ${p.existingId})` : ''}  [${p.draft.series} #${p.draft.order}]  ${p.draft.slug}`
    );
  }

  if (!YES) {
    console.log('\nDry run. Re-run with --yes to publish.');
    return;
  }

  const cookie = await login();
  let failures = 0;
  for (const p of plan) {
    const body = { ...p.draft };
    if (!body.date) body.date = new Date().toISOString().slice(0, 10);
    const pathname =
      p.action === 'UPDATE' ? `/api/admin/blog-posts?id=${p.existingId}` : '/api/admin/blog-posts';
    const { res, json } = await api(pathname, {
      method: p.action === 'UPDATE' ? 'PUT' : 'POST',
      body,
      cookie,
    });
    if (res.ok && json?.success) {
      console.log(`  OK ${p.action} ${p.draft.slug} → id ${json.post?.id}`);
    } else {
      failures++;
      console.error(`  FAIL ${p.action} ${p.draft.slug} (${res.status}): ${json?.error || ''}`);
    }
  }

  if (failures) {
    console.error(`\n${failures} draft(s) failed to publish.`);
    process.exit(1);
  }
  console.log('\nAll published. Now run: node seo-pipeline/generate-sitemap.mjs');
  console.log('Then commit public/sitemap.xml and push so the deploy picks it up.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
