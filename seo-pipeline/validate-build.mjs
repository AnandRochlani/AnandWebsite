#!/usr/bin/env node
/**
 * Validate the generated static SEO surface before deployment.
 *
 * This intentionally inspects dist/ (what crawlers receive), not React source.
 * Structural failures exit non-zero and block the build. Content-depth findings
 * are warnings so editors can improve legacy articles without breaking deploys.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..');
const DIST = path.join(REPO, 'dist');
const SITEMAP = path.join(REPO, 'public', 'sitemap.xml');
const SITE = 'https://anandrochlani.com';

const errors = [];
const warnings = [];
const pages = [];

const decode = (value = '') =>
  String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const text = (value = '') =>
  decode(String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

function one(html, pattern) {
  const matches = [...html.matchAll(pattern)];
  return { count: matches.length, value: matches[0]?.[1] ? decode(matches[0][1].trim()) : '' };
}

function routeFile(url) {
  const pathname = new URL(url).pathname;
  return pathname === '/'
    ? path.join(DIST, 'index.html')
    : path.join(DIST, pathname.replace(/^\/|\/$/g, ''), 'index.html');
}

function validateIndexable(url, file) {
  if (!fs.existsSync(file)) {
    errors.push(`${url}: missing prerendered file ${path.relative(REPO, file)}`);
    return;
  }

  const html = fs.readFileSync(file, 'utf8');
  const title = one(html, /<title>([\s\S]*?)<\/title>/gi);
  const description = one(
    html,
    /<meta\s+name="description"\s+content="([^"]*)"\s*\/?>/gi
  );
  const canonical = one(
    html,
    /<link\s+rel="canonical"\s+href="([^"]*)"\s*\/?>/gi
  );
  const robots = one(html, /<meta\s+name="robots"\s+content="([^"]*)"\s*\/?>/gi);
  const h1 = one(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi);
  const ogImage = one(
    html,
    /<meta\s+property="og:image"\s+content="([^"]*)"\s*\/?>/gi
  );

  if (title.count !== 1) errors.push(`${url}: expected one title, found ${title.count}`);
  if (title.value.length < 30 || title.value.length > 60) {
    errors.push(`${url}: title length ${title.value.length}, expected 30-60`);
  }
  if (description.count !== 1) {
    errors.push(`${url}: expected one meta description, found ${description.count}`);
  } else if (description.value.length < 70 || description.value.length > 160) {
    errors.push(`${url}: description length ${description.value.length}, expected 70-160`);
  }
  if (canonical.count !== 1) errors.push(`${url}: expected one canonical, found ${canonical.count}`);
  if (canonical.value !== url) {
    errors.push(`${url}: canonical is ${canonical.value || '(missing)'}`);
  }
  if (robots.value.includes('noindex')) errors.push(`${url}: indexable sitemap URL is noindex`);
  if (h1.count !== 1) errors.push(`${url}: expected one h1, found ${h1.count}`);
  if (!ogImage.value) errors.push(`${url}: missing og:image`);

  const jsonBlocks = [
    ...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi),
  ];
  if (!jsonBlocks.length) errors.push(`${url}: missing JSON-LD`);
  for (const block of jsonBlocks) {
    try {
      JSON.parse(block[1].replace(/<\\\//g, '</'));
    } catch (error) {
      errors.push(`${url}: invalid JSON-LD (${error.message})`);
    }
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt="[^"]*"/i.test(match[0])) errors.push(`${url}: image missing alt text`);
  }

  if (new URL(url).pathname.startsWith('/blog/')) {
    const article = html.match(/<article\b[\s\S]*?<\/article>/i)?.[0] || '';
    const words = text(article).split(/\s+/).filter(Boolean).length;
    if (words < 300) warnings.push(`${url}: thin article body (${words} words)`);
  }

  pages.push({ url, title: title.value, description: description.value });
}

function validateNoindexShell(name) {
  const file = path.join(DIST, name);
  if (!fs.existsSync(file)) {
    errors.push(`${name}: missing`);
    return;
  }
  const html = fs.readFileSync(file, 'utf8');
  const robots = one(html, /<meta\s+name="robots"\s+content="([^"]*)"\s*\/?>/gi);
  const canonical = one(
    html,
    /<link\s+rel="canonical"\s+href="([^"]*)"\s*\/?>/gi
  );
  if (!robots.value.includes('noindex')) errors.push(`${name}: must be noindex`);
  if (canonical.count) errors.push(`${name}: noindex shell must not have a canonical`);
}

if (!fs.existsSync(SITEMAP)) {
  errors.push('public/sitemap.xml is missing');
} else {
  const sitemap = fs.readFileSync(SITEMAP, 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1]));
  if (!urls.length) errors.push('sitemap has no URLs');
  if (new Set(urls).size !== urls.length) errors.push('sitemap contains duplicate URLs');
  for (const url of urls) {
    if (!url.startsWith(`${SITE}/`) && url !== `${SITE}/`) {
      errors.push(`${url}: sitemap URL uses the wrong host`);
      continue;
    }
    validateIndexable(url, routeFile(url));
  }
}

validateNoindexShell('app-shell.html');
validateNoindexShell('404.html');

for (const field of ['title', 'description']) {
  const seen = new Map();
  for (const page of pages) {
    const value = page[field];
    if (!value) continue;
    if (seen.has(value)) errors.push(`${page.url}: duplicate ${field} also used by ${seen.get(value)}`);
    else seen.set(value, page.url);
  }
}

for (const asset of [
  'logo.png',
  'og-image.jpg',
  'favicon.svg',
  'apple-touch-icon.png',
  'site.webmanifest',
  'robots.txt',
  'sitemap.xml',
]) {
  if (!fs.existsSync(path.join(DIST, asset))) errors.push(`dist/${asset}: missing`);
}

console.log(
  `[seo-validate] ${pages.length} indexable pages, ${errors.length} errors, ${warnings.length} content warnings`
);
for (const warning of warnings) console.warn(`  WARN ${warning}`);
for (const error of errors) console.error(`  FAIL ${error}`);

if (errors.length) process.exit(1);
