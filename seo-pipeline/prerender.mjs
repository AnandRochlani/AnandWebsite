#!/usr/bin/env node
/**
 * Post-build prerender for anandrochlani.com.
 *
 * The site is a client-rendered Vite + React SPA, so every URL used to serve the
 * identical `index.html`: same generic <title>, same meta description, no canonical,
 * and no article text anywhere in the HTML source. Crawlers that do not execute
 * JavaScript — and every social / AI / link-preview fetcher — saw one duplicate page
 * repeated across the whole site.
 *
 * This step runs AFTER `vite build` and writes a real static HTML file per route:
 *
 *   dist/index.html                      → home
 *   dist/blog/index.html                 → blog index
 *   dist/blog/<slug>/index.html          → one per post, with the full article inline
 *   dist/courses/index.html              → courses index
 *   dist/courses/<id>/index.html         → one per course
 *   dist/jobs/index.html                 → jobs
 *
 * Vercel checks the filesystem BEFORE applying the SPA rewrite in vercel.json, so a
 * request for /blog/<slug> is served the prerendered file; anything not prerendered
 * still falls through to the SPA shell. Nothing regresses.
 *
 * The injected markup reuses the #static-header / #static-content / #static-footer
 * convention that already exists in index.html — src/main.jsx hides and removes those
 * nodes as soon as React mounts, so the user-visible result is unchanged. The static
 * copy and the React copy render the same content; this is a prerender, not cloaking.
 *
 *   node seo-pipeline/prerender.mjs [--base <url>] [--dist <dir>] [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Same helper the app uses, so prerendered course URLs match the ones CoursesPage links to.
import { slugify } from '../src/lib/slug.js';
import { getAllBlogPosts } from '../src/data/blogPosts.js';
import { defaultCourses } from '../src/data/courses.js';
import { comparePosts, isIndexablePost } from '../src/lib/contentTaxonomy.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..');

// Apex only. www.anandrochlani.com is not attached in Vercel and fails TLS, so it
// must never appear in a canonical, an og:url, or a sitemap entry.
const CANONICAL_HOST = 'https://anandrochlani.com';
const SITE_NAME = 'AnandRochlani';
const AUTHOR = 'Anand Rochlani';
const LOGO = `${CANONICAL_HOST}/logo.png`;
const DEFAULT_OG = `${CANONICAL_HOST}/og-image.jpg`;
const COURSE_URL =
  'https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73';

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const has = (name) => args.includes(name);

const API_BASE = (flag('--base', CANONICAL_HOST)).replace(/\/$/, '');
const DIST = path.resolve(REPO, flag('--dist', 'dist'));
const DRY_RUN = has('--dry-run');

if (has('--help') || has('-h')) {
  console.log(`
prerender.mjs — emit static HTML per route after \`vite build\`

  --base <url>    API origin to pull content from (default ${CANONICAL_HOST})
  --dist <dir>    build output directory (default dist)
  --dry-run       report what would be written, write nothing
  --help          this message
`);
  process.exit(0);
}

/* ── helpers ─────────────────────────────────────────────────────────── */

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Strip tags for meta descriptions / plain-text excerpts. */
const toText = (html = '') =>
  String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const clamp = (s, n) => {
  const t = toText(s);
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > n * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
};

/**
 * Body HTML comes from our own database, but the prerendered file is static and
 * un-sanitised by React, so strip anything executable before it goes to disk.
 */
const sanitize = (html = '') =>
  String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');

const isoDate = (d) => {
  const date = d ? new Date(d) : new Date();
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
};

const humanDate = (d) => {
  const date = d ? new Date(d) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

/* ── head injection ──────────────────────────────────────────────────── */

/**
 * Remove every tag the per-route head is about to own, so a route can never end up
 * with two titles or two canonicals. Everything else in <head> (preloads, icons,
 * stylesheets, the Vite script tags) is left untouched.
 */
function stripManagedHead(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="title"[^>]*>/gi, '')
    .replace(/<meta\s+name="description"[^>]*>/gi, '')
    .replace(/<meta\s+name="keywords"[^>]*>/gi, '')
    .replace(/<meta\s+name="robots"[^>]*>/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
    .replace(/<script\s+type="application\/ld\+json"[\s\S]*?<\/script>/gi, '');
}

/**
 * Mirror SEOHead's rule (append the brand unless it is already in the title) so the
 * prerendered <title> and the one React sets after mount are byte-identical.
 */
const pageTitle = (t) => {
  const raw = String(t || '').replace(/\s+/g, ' ').trim();
  if (raw.includes(SITE_NAME)) return clamp(raw, 60);
  const suffix = ` | ${SITE_NAME}`;
  return `${clamp(raw, 60 - suffix.length)}${suffix}`;
};

function metaDescription(post) {
  const description = toText(post.description || '');
  if (description.length >= 70) return clamp(description, 160);
  return clamp(`${description} ${toText(post.content || '')}`, 160);
}

function headTags({ title: rawTitle, description, canonical, image, type, published, modified, keywords, jsonLd, noindex }) {
  const img = image || DEFAULT_OG;
  const title = pageTitle(rawTitle);
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="title" content="${esc(title)}" />`,
    `<meta name="description" content="${esc(description)}" />`,
    noindex
      ? `<meta name="robots" content="noindex, follow" />`
      : `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`,
    keywords ? `<meta name="keywords" content="${esc(keywords)}" />` : '',
    // A noindex shell must not also claim a canonical — that is a contradictory signal.
    canonical ? `<link rel="canonical" href="${esc(canonical)}" />` : '',
    `<meta property="og:type" content="${esc(type)}" />`,
    canonical ? `<meta property="og:url" content="${esc(canonical)}" />` : '',
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:locale" content="en_US" />`,
    published ? `<meta property="article:published_time" content="${esc(published)}" />` : '',
    modified ? `<meta property="article:modified_time" content="${esc(modified)}" />` : '',
    published ? `<meta property="article:author" content="${esc(AUTHOR)}" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    canonical ? `<meta name="twitter:url" content="${esc(canonical)}" />` : '',
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(img)}" />`,
  ].filter(Boolean);

  (jsonLd || []).forEach((block, i) => {
    // </script> inside JSON would close the tag early.
    const json = JSON.stringify(block).replace(/<\//g, '<\\/');
    // The id is load-bearing: SEOHead looks for it and skips its own (thinner)
    // JSON-LD when a prerendered block is already on the page.
    tags.push(
      `<script type="application/ld+json" id="ld-prerender-${i}"${
        canonical ? ` data-page-url="${esc(canonical)}"` : ''
      }>${json}</script>`
    );
  });

  return tags.map((t) => `\t\t${t}`).join('\n');
}

/* ── structured data ─────────────────────────────────────────────────── */

const organization = {
  '@type': 'Organization',
  '@id': `${CANONICAL_HOST}/#organization`,
  name: SITE_NAME,
  url: CANONICAL_HOST,
  logo: { '@type': 'ImageObject', url: LOGO },
};

const breadcrumb = (trail) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((t, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: t.name,
    item: t.url,
  })),
});

function articleSchema(post, canonical) {
  const body = toText(post.content);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    headline: clamp(post.title, 110),
    description: metaDescription(post),
    image: post.featuredImage || DEFAULT_OG,
    datePublished: isoDate(post.date),
    dateModified: isoDate(post.updatedAt || post.updated_at || post.date),
    author: { '@type': 'Person', name: post.author || AUTHOR, url: CANONICAL_HOST },
    publisher: organization,
    articleSection: post.category || 'System Design',
    inLanguage: 'en-US',
    wordCount: body ? body.split(/\s+/).length : undefined,
    keywords: post.keywords || undefined,
    isAccessibleForFree: true,
  };
}

/* ── static body markup ──────────────────────────────────────────────── */

const staticHeader = `\t\t\t<header id="static-header">
\t\t\t\t<nav>
\t\t\t\t\t<a href="/">${SITE_NAME}</a>
\t\t\t\t\t<div>
\t\t\t\t\t\t<a href="/">Home</a>
\t\t\t\t\t\t<a href="/courses">Courses</a>
\t\t\t\t\t\t<a href="/blog">Blog</a>
\t\t\t\t\t\t<a href="/system-design-case-studies">Case Studies</a>
\t\t\t\t\t\t<a href="/system-design-glossary">Glossary</a>
\t\t\t\t\t\t<a href="/about">About</a>
\t\t\t\t\t\t<a href="/jobs">Jobs</a>
\t\t\t\t\t</div>
\t\t\t\t</nav>
\t\t\t</header>`;

const staticFooter = `\t\t\t<footer id="static-footer">
\t\t\t\t<p>&copy; ${new Date().getFullYear()} ${SITE_NAME}</p>
\t\t\t\t<nav>
\t\t\t\t\t<a href="/">Home</a>
\t\t\t\t\t<a href="/courses">Courses</a>
\t\t\t\t\t<a href="/blog">Blog</a>
\t\t\t\t\t<a href="/system-design-case-studies">Case Studies</a>
\t\t\t\t\t<a href="/system-design-glossary">Glossary</a>
\t\t\t\t\t<a href="/about">About</a>
\t\t\t\t\t<a href="/jobs">Jobs</a>
\t\t\t\t</nav>
\t\t\t</footer>`;

/** Links to sibling posts so every article is reachable in raw HTML, not just after JS. */
function seriesNav(posts, currentSlug) {
  const others = posts.filter((p) => p.slug && p.slug !== currentSlug).slice(0, 20);
  if (!others.length) return '';
  const items = others
    .map((p) => `\t\t\t\t\t\t<li><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a></li>`)
    .join('\n');
  return `\n\t\t\t\t\t<nav aria-label="More tutorials">
\t\t\t\t\t\t<h2>More in the System Design Tutorial series</h2>
\t\t\t\t\t\t<ul>
${items}
\t\t\t\t\t\t</ul>
\t\t\t\t\t</nav>`;
}

function postBody(post, allPosts) {
  const img = post.featuredImage
    ? `\n\t\t\t\t\t<img src="${esc(post.featuredImage)}" alt="${esc(post.title)}" loading="lazy" decoding="async" />`
    : '';
  const meta = [post.author || AUTHOR, humanDate(post.date), post.readTime]
    .filter(Boolean)
    .map(esc)
    .join(' · ');
  const hasCourseCta = String(post.content || '').includes(
    'udemy.com/course/system-design-fundamental/'
  );
  const fallbackCourseCta = hasCourseCta
    ? ''
    : `\n\t\t\t\t\t<p><a href="${esc(COURSE_URL)}" rel="sponsored noopener">Go deeper: System Design Fundamentals for Interviews on Udemy</a></p>`;

  return `\t\t\t<main id="static-content">
\t\t\t\t<article id="static-blog-post-content">
\t\t\t\t\t<nav aria-label="Breadcrumb">
\t\t\t\t\t\t<a href="/">Home</a> / <a href="/blog">Blog</a> / <span>${esc(post.title)}</span>
\t\t\t\t\t</nav>
\t\t\t\t\t<h1>${esc(post.title)}</h1>
\t\t\t\t\t<p>${meta}</p>${img}
\t\t\t\t\t<p>${esc(post.description || '')}</p>
\t\t\t\t\t<div id="static-article-body">
${sanitize(post.content || '')}
\t\t\t\t\t</div>${fallbackCourseCta}${seriesNav(allPosts, post.slug)}
\t\t\t\t</article>
\t\t\t</main>`;
}

function listBody(heading, intro, items, id = 'static-content') {
  const lis = items
    .map(
      (it) => `\t\t\t\t\t<li>
\t\t\t\t\t\t<h2><a href="${esc(it.url)}">${esc(it.title)}</a></h2>
\t\t\t\t\t\t<p>${esc(it.description || '')}</p>
\t\t\t\t\t</li>`
    )
    .join('\n');
  return `\t\t\t<main id="${id}">
\t\t\t\t<h1>${esc(heading)}</h1>
\t\t\t\t<p>${esc(intro)}</p>
\t\t\t\t<ul id="static-blog-content">
${lis}
\t\t\t\t</ul>
\t\t\t</main>`;
}

/* ── page assembly ───────────────────────────────────────────────────── */

function renderPage(template, { head, body }) {
  let html = stripManagedHead(template);
  html = html.replace(/<\/head>/i, `${head}\n\t</head>`);

  // Replace the contents of #root. React's createRoot().render() discards these
  // children on mount, and main.jsx removes the #static-* nodes explicitly.
  const rootOpen = html.search(/<div\s+id="root"\s*>/i);
  if (rootOpen === -1) throw new Error('could not find <div id="root"> in the build template');
  const openTag = html.match(/<div\s+id="root"\s*>/i)[0];
  const start = rootOpen + openTag.length;

  // Walk forward tracking <div> depth to find the matching close tag.
  let depth = 1;
  let i = start;
  const re = /<div\b[^>]*>|<\/div>/gi;
  re.lastIndex = start;
  let m;
  while ((m = re.exec(html))) {
    depth += m[0].startsWith('</') ? -1 : 1;
    if (depth === 0) {
      i = m.index;
      break;
    }
  }
  if (depth !== 0) throw new Error('unbalanced <div id="root"> in the build template');

  return `${html.slice(0, start)}\n${body}\n\t\t${html.slice(i)}`;
}

function writeFile(rel, html, written, label = rel) {
  const dest = path.join(DIST, rel);
  if (!DRY_RUN) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, html, 'utf8');
  }
  written.push({ route: label, file: rel, bytes: Buffer.byteLength(html) });
}

function write(routePath, html, written) {
  const rel = routePath === '/' ? 'index.html' : path.join(routePath.replace(/^\//, ''), 'index.html');
  writeFile(rel, html, written, routePath);
}

/* ── main ────────────────────────────────────────────────────────────── */

async function getJson(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'anandrochlani-prerender/1.0' } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`${url} returned ${contentType || 'an unknown content type'} instead of JSON`);
  }
  return res.json();
}

function bundledContent() {
  return {
    posts: getAllBlogPosts().filter((post) => post && post.slug),
    courses: defaultCourses.map((course) => ({
      ...course,
      slug: course.slug || slugify(course.name || course.title || String(course.id)),
    })),
  };
}

function mergeByKey(bundledItems, liveItems, keyFor, resolve = (_bundled, live) => live) {
  const merged = new Map();
  for (const item of bundledItems) {
    const key = keyFor(item);
    if (key) merged.set(key, item);
  }
  // Keep published/admin edits authoritative while retaining bundled articles
  // that have not reached the production database yet.
  for (const item of liveItems) {
    const key = keyFor(item);
    if (key) merged.set(key, merged.has(key) ? resolve(merged.get(key), item) : item);
  }
  return [...merged.values()];
}

function contentWordCount(item) {
  return toText(item?.content || '')
    .split(/\s+/)
    .filter(Boolean).length;
}

async function main() {
  const templatePath = path.join(DIST, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error(`No build found at ${path.relative(process.cwd(), templatePath)}. Run \`npm run build\` first.`);
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, 'utf8');

  const bundled = bundledContent();
  let posts = bundled.posts;
  let courses = bundled.courses;
  try {
    const [p, c] = await Promise.all([
      getJson(`${API_BASE}/api/public/blog-posts`),
      getJson(`${API_BASE}/api/public/courses`).catch(() => ({ courses: [] })),
    ]);
    posts = mergeByKey(
      bundled.posts,
      (p.posts || []).filter((x) => x && x.slug),
      (post) => post.slug,
      (bundledPost, livePost) =>
        contentWordCount(bundledPost) > contentWordCount(livePost)
          ? {
              ...livePost,
              title: bundledPost.title,
              description: bundledPost.description,
              content: bundledPost.content,
              readTime: bundledPost.readTime,
              series: bundledPost.series,
              order: bundledPost.order,
            }
          : livePost
    );
    courses = mergeByKey(
      bundled.courses,
      c.courses || [],
      (course) => course.slug || String(course.id || ''),
      // Admin edits stay authoritative, but the database has no column for the
      // build-time SEO fields, so a wholesale replacement silently dropped them
      // and every course page fell back to the same generic description.
      (bundledCourse, liveCourse) => ({ ...bundledCourse, ...liveCourse })
    );
  } catch (e) {
    // A remote API outage must not turn a production deploy back into one generic
    // client-rendered shell. The bundled content is the same fail-safe used by the
    // public API, so core pages still ship crawlable HTML and can be refreshed on
    // the next deploy after the API is restored.
    console.warn(
      `[prerender] remote content unavailable (${e.message}); using ${posts.length} bundled posts and ${courses.length} bundled courses.`
    );
  }

  // This site has a small number of deliberate editorial clusters (see
  // src/lib/contentTaxonomy.js). Legacy template posts remain accessible through
  // the app, but they are noindex and omitted from the static crawl surface so
  // they do not dilute those clusters.
  posts = posts.filter(isIndexablePost);
  posts.sort(comparePosts);
  const written = [];

  /* home */
  write(
    '/',
    renderPage(template, {
      head: headTags({
        title: 'System Design & Coding Interview Tutorials | AnandRochlani',
        description:
          'Free System Design and LeetCode pattern tutorials for interview prep — caching, sharding, consistent hashing, sliding window, graphs and full case studies.',
        canonical: `${CANONICAL_HOST}/`,
        type: 'website',
        keywords: 'system design, system design interview, system design tutorial, software architecture',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': `${CANONICAL_HOST}/#website`,
            url: CANONICAL_HOST,
            name: SITE_NAME,
            description: 'System Design tutorials and engineering courses.',
            publisher: organization,
            inLanguage: 'en-US',
          },
          { '@context': 'https://schema.org', ...organization },
        ],
      }),
      body: [
        staticHeader,
        listBody(
          'System Design Tutorials & Courses',
          'Learn system design the way it is actually asked in interviews — fundamentals first, then full case studies.',
          posts.slice(0, 12).map((p) => ({
            url: `/blog/${p.slug}`,
            title: p.title,
            description: p.description,
          }))
        ),
        staticFooter,
      ].join('\n'),
    }),
    written
  );

  /* blog index */
  write(
    '/blog',
    renderPage(template, {
      head: headTags({
        title: 'System Design & LeetCode Tutorial Series | AnandRochlani',
        description:
          'Two tutorial series: System Design fundamentals with real case studies, and the LeetCode patterns behind Amazon and Google coding interviews.',
        canonical: `${CANONICAL_HOST}/blog`,
        type: 'website',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'System Design Tutorial Series',
            url: `${CANONICAL_HOST}/blog`,
            isPartOf: { '@id': `${CANONICAL_HOST}/#website` },
            publisher: organization,
          },
          breadcrumb([
            { name: 'Home', url: `${CANONICAL_HOST}/` },
            { name: 'Blog', url: `${CANONICAL_HOST}/blog` },
          ]),
        ],
      }),
      body: [
        staticHeader,
        listBody(
          'System Design Tutorial Series',
          'Every tutorial in the series, in order.',
          posts.map((p) => ({ url: `/blog/${p.slug}`, title: p.title, description: p.description }))
        ),
        staticFooter,
      ].join('\n'),
    }),
    written
  );

  /* author / trust page */
  write(
    '/about',
    renderPage(template, {
      head: headTags({
        title: 'About Anand Rochlani',
        description:
          'Meet Anand Rochlani, Salesforce Member of Technical Staff and creator of practical System Design tutorials and an interview-focused Udemy course.',
        canonical: `${CANONICAL_HOST}/about`,
        type: 'website',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'Person',
            '@id': `${CANONICAL_HOST}/about#person`,
            name: AUTHOR,
            url: `${CANONICAL_HOST}/about`,
            jobTitle: 'Member of Technical Staff',
            worksFor: { '@type': 'Organization', name: 'Salesforce' },
            sameAs: [
              'https://in.linkedin.com/in/anand-rochlani',
              'https://www.youtube.com/@anandrochlani5226',
              'https://www.udemy.com/user/anand-561/',
            ],
          },
          breadcrumb([
            { name: 'Home', url: `${CANONICAL_HOST}/` },
            { name: 'About', url: `${CANONICAL_HOST}/about` },
          ]),
        ],
      }),
      body: [
        staticHeader,
        `\t\t\t<main id="static-content">
\t\t\t\t<article>
\t\t\t\t\t<h1>Anand Rochlani</h1>
\t\t\t\t\t<p>Member of Technical Staff at Salesforce and System Design educator.</p>
\t\t\t\t\t<h2>What I teach</h2>
\t\t\t\t\t<p>Practical lessons on scalable architecture, distributed systems, and interview trade-offs.</p>
\t\t\t\t\t<h2>System Design Fundamentals for Interviews</h2>
\t\t\t\t\t<p>The Udemy course includes 8 sections, 49 lectures, 5 hours 40 minutes of video, and real interview case studies.</p>
\t\t\t\t\t<p><a href="${esc(COURSE_URL)}" rel="sponsored noopener">View the System Design course on Udemy</a></p>
\t\t\t\t</article>
\t\t\t</main>`,
        staticFooter,
      ].join('\n'),
    }),
    written
  );

  /* case-study collection */
  write(
    '/system-design-case-studies',
    renderPage(template, {
      head: headTags({
        title: 'System Design Case Studies for Interviews',
        description:
          'Practice five complete System Design case studies covering requirements, estimates, APIs, architecture, bottlenecks, and interview trade-offs.',
        canonical: `${CANONICAL_HOST}/system-design-case-studies`,
        type: 'website',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'System Design Case Studies for Interviews',
            url: `${CANONICAL_HOST}/system-design-case-studies`,
            isPartOf: { '@id': `${CANONICAL_HOST}/#website` },
            publisher: organization,
          },
          breadcrumb([
            { name: 'Home', url: `${CANONICAL_HOST}/` },
            { name: 'System Design Case Studies', url: `${CANONICAL_HOST}/system-design-case-studies` },
          ]),
        ],
      }),
      body: [
        staticHeader,
        listBody(
          'System Design Case Studies for Interviews',
          'Practice complete designs from requirements and capacity estimates through architecture, bottlenecks, failures, and trade-offs.',
          [
            ['Design a URL Shortener', 'designing-a-url-shortener-complete-system-design-case-study', 'Read-heavy lookup, caching, replication, and sharding.'],
            ['Design a Social Bookmarking Service', 'design-a-social-bookmarking-service-delicious-system-design-case-study', 'Tags, cache partitioning, and data growth.'],
            ['Design a Coding Contest Platform', 'design-a-coding-contest-platform-leetcode-system-design-interview', 'Sandbox workers, queues, traffic spikes, and leaderboards.'],
            ['Design Facebook News Feed', 'design-facebook-news-feed-system-design-interview-guide', 'Fanout, feed caches, hot users, and ranking.'],
            ['Design Google Typeahead', 'design-google-typeahead-autocomplete-system-design-interview', 'Tries, precomputation, caching, and low latency.'],
          ].map(([title, slug, description]) => ({
            title,
            description,
            url: `/blog/${slug}`,
          }))
        ),
        staticFooter,
      ].join('\n'),
    }),
    written
  );

  /* glossary / definition hub */
  write(
    '/system-design-glossary',
    renderPage(template, {
      head: headTags({
        title: 'System Design Glossary: 20 Essential Terms',
        description:
          'A concise System Design glossary covering caching, sharding, replication, consistency, queues, latency, throughput, and interview terminology.',
        canonical: `${CANONICAL_HOST}/system-design-glossary`,
        type: 'website',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'DefinedTermSet',
            name: 'System Design Glossary',
            url: `${CANONICAL_HOST}/system-design-glossary`,
            description: 'Definitions of essential System Design and distributed-systems terms.',
          },
          breadcrumb([
            { name: 'Home', url: `${CANONICAL_HOST}/` },
            { name: 'System Design Glossary', url: `${CANONICAL_HOST}/system-design-glossary` },
          ]),
        ],
      }),
      body: [
        staticHeader,
        `\t\t\t<main id="static-content">
\t\t\t\t<h1>System Design Glossary</h1>
\t\t\t\t<p>Twenty terms you should be able to define, compare, and apply during a System Design interview.</p>
\t\t\t\t<dl>
\t\t\t\t\t<dt>Availability</dt><dd>The percentage of time a system successfully serves requests.</dd>
\t\t\t\t\t<dt>Cache</dt><dd>Fast temporary storage that reduces latency and database load.</dd>
\t\t\t\t\t<dt>CAP theorem</dt><dd>During a network partition, a distributed operation chooses consistency or availability.</dd>
\t\t\t\t\t<dt>CDN</dt><dd>A distributed network that serves cached content close to users.</dd>
\t\t\t\t\t<dt>Consistency</dt><dd>A guarantee describing the ordering or freshness clients observe.</dd>
\t\t\t\t\t<dt>Consistent hashing</dt><dd>A partitioning method where membership changes move only a small share of keys.</dd>
\t\t\t\t\t<dt>Database index</dt><dd>A structure that speeds reads at the cost of storage and write work.</dd>
\t\t\t\t\t<dt>Eventual consistency</dt><dd>Replicas may temporarily disagree but converge later.</dd>
\t\t\t\t\t<dt>Horizontal scaling</dt><dd>Adding machines or instances to increase capacity.</dd>
\t\t\t\t\t<dt>Idempotency</dt><dd>Repeating an operation has the same final effect as performing it once.</dd>
\t\t\t\t\t<dt>Latency</dt><dd>The time one operation spends in the system.</dd>
\t\t\t\t\t<dt>Load balancer</dt><dd>A component that distributes requests across healthy instances.</dd>
\t\t\t\t\t<dt>Message queue</dt><dd>A durable buffer that decouples producers and consumers.</dd>
\t\t\t\t\t<dt>Partition key</dt><dd>The value that decides which shard stores a record.</dd>
\t\t\t\t\t<dt>Replication</dt><dd>Maintaining multiple data copies for availability, reads, or recovery.</dd>
\t\t\t\t\t<dt>Sharding</dt><dd>Splitting a dataset across independent partitions.</dd>
\t\t\t\t\t<dt>SLA</dt><dd>A reliability commitment measured through service objectives.</dd>
\t\t\t\t\t<dt>Throughput</dt><dd>The amount of work completed per unit of time.</dd>
\t\t\t\t\t<dt>Vertical scaling</dt><dd>Increasing the resources of one machine.</dd>
\t\t\t\t\t<dt>Write-ahead log</dt><dd>An append-only change record written before database pages update.</dd>
\t\t\t\t</dl>
\t\t\t</main>`,
        staticFooter,
      ].join('\n'),
    }),
    written
  );

  /* one file per post */
  for (const post of posts) {
    const canonical = `${CANONICAL_HOST}/blog/${post.slug}`;
    write(
      `/blog/${post.slug}`,
      renderPage(template, {
        head: headTags({
          title: post.title,
          description: metaDescription(post),
          canonical,
          image: post.featuredImage,
          type: 'article',
          published: isoDate(post.date),
          modified: isoDate(post.updatedAt || post.updated_at || post.date),
          jsonLd: [
            articleSchema(post, canonical),
            breadcrumb([
              { name: 'Home', url: `${CANONICAL_HOST}/` },
              { name: 'Blog', url: `${CANONICAL_HOST}/blog` },
              { name: post.title, url: canonical },
            ]),
          ],
        }),
        body: [staticHeader, postBody(post, posts), staticFooter].join('\n'),
      }),
      written
    );
  }

  /* courses */
  write(
    '/courses',
    renderPage(template, {
      head: headTags({
        title: 'Interview Prep Courses',
        description:
          'Interview-focused engineering courses: system design fundamentals plus the LeetCode patterns behind the Amazon and Google coding interviews.',
        canonical: `${CANONICAL_HOST}/courses`,
        type: 'website',
        jsonLd: [
          breadcrumb([
            { name: 'Home', url: `${CANONICAL_HOST}/` },
            { name: 'Courses', url: `${CANONICAL_HOST}/courses` },
          ]),
        ],
      }),
      body: [
        staticHeader,
        listBody(
          'System Design and Coding Interview Courses',
          'Practical courses covering scalability, caching, databases, load balancing, and distributed systems.',
          courses.map((c) => ({
            url: `/courses/${c.slug || slugify(c.name || c.title || String(c.id))}`,
            title: c.name || c.title || `Course ${c.id}`,
            description: c.description,
          }))
        ),
        staticFooter,
      ].join('\n'),
    }),
    written
  );

  // Per-course FAQ sets. Keyed by slug; every course MUST have its own so the
  // three course pages do not ship identical FAQPage schema and body copy.
  const systemDesignFaqs = [
    {
      question: 'Who is this System Design course for?',
      answer:
        'It is designed for beginners, junior developers, career switchers, and self-taught engineers preparing for System Design interviews.',
    },
    {
      question: 'Do I need prior System Design experience?',
      answer:
        'No. Basic programming knowledge and familiarity with client-server applications or APIs are helpful, but the course starts from the fundamentals.',
    },
    {
      question: 'Which case studies are included?',
      answer:
        'The curriculum covers a social bookmarking service, consistent hashing, a coding contest platform, Facebook News Feed, and Google Typeahead.',
    },
    {
      question: 'How long is the course?',
      answer: 'The course contains 8 sections and 49 lectures with approximately 5 hours and 40 minutes of video.',
    },
    {
      question: 'Can I use the free resources before enrolling?',
      answer:
        'Yes. Start with the System Design roadmap, glossary, interview checklist, tutorials, and case-study hub, then use the course for a guided sequence.',
    },
    {
      question: 'Does the course guarantee an interview result?',
      answer:
        'No course can guarantee an interview outcome. This course provides a structured learning path and practical case studies for preparation.',
    },
  ];

  const amazonFaqs = [
    {
      question: 'Which LeetCode patterns does the Amazon course cover?',
      answer:
        'Fifteen: two pointers, sliding window, fast and slow pointers, in-place linked list reversal, stacks and monotonic stacks, modified binary search, tree BFS, tree DFS, graphs on grids, topological sort, heaps and top-K, subsets and backtracking, dynamic programming, greedy and intervals, and tries with union-find.',
    },
    {
      question: 'Why learn 15 patterns instead of grinding 300 problems?',
      answer:
        'Amazon rarely asks a problem you have already memorised. It asks a new problem that maps to a pattern you know. Learning the recognition signal for each pattern transfers to unseen problems; memorised solutions do not.',
    },
    {
      question: 'Do I need a computer science degree?',
      answer:
        'No. You need one language you are comfortable in and a basic idea of what an array, hash map, and linked list are. Examples are given in Python and Java, and the course re-teaches every data structure a pattern depends on.',
    },
    {
      question: 'Does the course cover Amazon Leadership Principles?',
      answer:
        'Yes. The final section maps your own project stories to the 14 Leadership Principles using the STAR structure, because the behavioural round is roughly half of the Amazon loop.',
    },
    {
      question: 'How long is the Amazon course?',
      answer:
        'It contains 111 lessons across 20 sections, four narrated mock interviews and five downloadable cheat sheets, at roughly 16 hours of video and about 11 minutes per lesson.',
    },
    {
      question: 'When does the Amazon course launch?',
      answer:
        'It is in production. The full curriculum is published on this page, and the free written pattern guides on the blog cover the same material in the meantime.',
    },
  ];

  const googleFaqs = [
    {
      question: 'Which problems are on the Google 50 list?',
      answer:
        'Fifty Google-tagged LeetCode problems grouped into 11 pattern sections, including Text Justification, Sentence Screen Fitting, Shortest Path in a Grid with Obstacles Elimination, Swim in Rising Water, Meeting Rooms III, Snapshot Array, Race Car, Robot Room Cleaner and Guess the Word.',
    },
    {
      question: 'How is a Google interview different from an Amazon interview?',
      answer:
        'Google scores General Cognitive Ability — how you reason out loud on a problem you have never seen — alongside Role-Related Knowledge, Leadership and Googleyness. The problems skew harder and stranger, and several are LeetCode Premium.',
    },
    {
      question: 'Is this course for beginners?',
      answer:
        'No. It assumes you already know the common patterns and want the harder, less-rehearsed Google set. Start with the Amazon patterns course or the free pattern guides first if you are new to LeetCode.',
    },
    {
      question: 'What does intuition-first teaching mean?',
      answer:
        'Each problem starts with how you would actually arrive at the solution — first instinct, the reframe, where brute force hurts, and the leap — before any code. Each solve then runs brute force, optimised, and space optimisation.',
    },
    {
      question: 'How long is the Google course?',
      answer:
        'Fifty problems across 11 pattern sections plus Googleyness and GCA preparation, at roughly 11 hours of video.',
    },
    {
      question: 'When does the Google course launch?',
      answer:
        'It is in production. The full 50-problem list and section breakdown are published on this page, and the free written pattern guides cover the underlying patterns in the meantime.',
    },
  ];

  const faqsBySlug = {
    'system-design-fundamental': systemDesignFaqs,
    'amazon-coding-interview-patterns': amazonFaqs,
    'google-coding-interview-50-problems': googleFaqs,
  };

  // Body copy under the H1, per course. Keeps each prerendered page's text unique.
  const bodyBySlug = {
    'system-design-fundamental': `\t\t\t\t<h2>Free tutorials or the guided course?</h2>
\t\t\t\t<p>Use the free roadmap, glossary, checklist, tutorials, and case studies for self-paced reference. Choose the course when you want the same fundamentals arranged as a guided video curriculum.</p>
\t\t\t\t<p><a href="/blog/system-design-interview-preparation-complete-guide-2026">Read the complete interview-preparation guide</a> · <a href="/system-design-case-studies">Explore the case-study hub</a></p>`,
    'amazon-coding-interview-patterns': `\t\t\t\t<h2>Patterns, not problem counts</h2>
\t\t\t\t<p>Three hundred solved problems does not make an Amazon offer; recognising which of fifteen patterns a new problem belongs to does. Every lesson names the recognition signal, writes the brute force and explains why it times out, then applies the pattern and states the complexity out loud.</p>
\t\t\t\t<p>This course is in production. The written pattern guides on the blog cover the same material and are free.</p>
\t\t\t\t<p><a href="/blog/leetcode-patterns-coding-interview-guide">Read the 15 LeetCode patterns guide</a> · <a href="/blog/sliding-window-pattern-explained-leetcode">Start with the sliding window pattern</a></p>`,
    'google-coding-interview-50-problems': `\t\t\t\t<h2>A fixed list of 50, taught intuition-first</h2>
\t\t\t\t<p>Google's loop leans on harder, stranger problems than the generic top-75 list — and scores General Cognitive Ability while you talk through them. Each of these fifty problems is taught from first instinct to optimal solution, then mapped to the reusable pattern underneath it.</p>
\t\t\t\t<p>This course is in production. The written pattern guides on the blog cover the underlying patterns and are free.</p>
\t\t\t\t<p><a href="/blog/google-coding-interview-questions-preparation-guide">Read the Google coding interview guide</a> · <a href="/blog/leetcode-patterns-coding-interview-guide">Learn the pattern set first</a></p>`,
  };

  for (const c of courses) {
    const name = c.name || c.title || `Course ${c.id}`;
    // CoursesPage links to the slug form, so that is the primary indexable URL.
    // The numeric /courses/<id> form is prerendered too (CourseDetail resolves both)
    // but canonicalises to the slug so the two do not compete as duplicates.
    const slug = c.slug || slugify(name);
    const canonical = `${CANONICAL_HOST}/courses/${slug}`;
    const courseFaqs = faqsBySlug[slug] || [];
    const courseBody = bodyBySlug[slug] || '';
    // Mirrors CourseDetail's SEOHead description exactly, so the prerendered and
    // client-rendered pages never disagree — and every course gets its own.
    const courseDescription = clamp(
      toText(c.seoDescription || c.description || name),
      300
    );
    for (const routeKey of [slug, String(c.id)]) {
    write(
      `/courses/${routeKey}`,
      renderPage(template, {
        head: headTags({
          // Mirrors CourseDetail's SEOHead title so the prerendered and rendered
          // titles are identical.
          title: c.seoTitle || `${name} Course`,
          description: courseDescription,
          canonical,
          image: c.featuredImage || c.image || c.thumbnail,
          type: 'website',
          jsonLd: [
            {
              '@context': 'https://schema.org',
              '@type': 'Course',
              name,
              description: c.description ? toText(c.description) : name,
              url: canonical,
              provider: organization,
              inLanguage: 'en-US',
              ...(c.level ? { educationalLevel: c.level } : {}),
              ...(c.learningOutcomes?.length ? { teaches: c.learningOutcomes } : {}),
              // A course that has not shipped has no instance a learner can join,
              // so only published courses advertise one.
              ...(c.status === 'published' && c.workload
                ? {
                    hasCourseInstance: {
                      '@type': 'CourseInstance',
                      courseMode: 'online',
                      courseWorkload: c.workload,
                    },
                  }
                : {}),
            },
            breadcrumb([
              { name: 'Home', url: `${CANONICAL_HOST}/` },
              { name: 'Courses', url: `${CANONICAL_HOST}/courses` },
              { name, url: canonical },
            ]),
            ...(courseFaqs.length
              ? [
                  {
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: courseFaqs.map(({ question, answer }) => ({
                      '@type': 'Question',
                      name: question,
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: answer,
                      },
                    })),
                  },
                ]
              : []),
          ],
        }),
        body: [
          staticHeader,
          `\t\t\t<main id="static-content">
\t\t\t\t<h1>${esc(name)}</h1>
\t\t\t\t<p>${esc(c.description ? clamp(c.description, 400) : '')}</p>
${courseBody}
\t\t\t\t<h2>Curriculum</h2>
\t\t\t\t<ul>
${(c.modules || [])
  .map(
    (m) =>
      `\t\t\t\t\t<li>${esc(m.title)} — ${esc(String(m.lessons))} lessons, ${esc(m.duration)}</li>`
  )
  .join('\n')}
\t\t\t\t</ul>
${
  courseFaqs.length
    ? `\t\t\t\t<h2>Frequently asked questions</h2>\n${courseFaqs
        .map(
          ({ question, answer }) =>
            `\t\t\t\t<h3>${esc(question)}</h3>\n\t\t\t\t<p>${esc(answer)}</p>`
        )
        .join('\n')}`
    : ''
}
\t\t\t</main>`,
          staticFooter,
        ].join('\n'),
      }),
      written
    );
    }
  }

  /* jobs — indexable but low priority */
  write(
    '/jobs',
    renderPage(template, {
      head: headTags({
        title: 'Software Engineering Jobs | AnandRochlani',
        description:
          'Curated software engineering job listings — backend, full-stack and distributed systems roles for developers preparing for their next move.',
        canonical: `${CANONICAL_HOST}/jobs`,
        type: 'website',
        jsonLd: [
          breadcrumb([
            { name: 'Home', url: `${CANONICAL_HOST}/` },
            { name: 'Jobs', url: `${CANONICAL_HOST}/jobs` },
          ]),
        ],
      }),
      body: [
        staticHeader,
        `\t\t\t<main id="static-content"><h1>Software Engineering Jobs</h1></main>`,
        staticFooter,
      ].join('\n'),
    }),
    written
  );

  /* SPA fallback shell.
   *
   * vercel.json rewrites anything with no matching file to this page: client-only
   * routes (/admin, /saved-courses, /jobs/:id, /courses/:slug) and genuinely dead
   * URLs. It must NOT be the prerendered homepage — that would hand every mistyped
   * URL an indexable, fully-formed duplicate of the home page before React runs.
   * Marked noindex with no canonical; React's NotFoundPage renders the 404 body,
   * and real pages restore `index, follow` via SEOHead once they mount. */
  writeFile(
    'app-shell.html',
    renderPage(template, {
      head: headTags({
        title: 'AnandRochlani',
        description: 'System Design tutorials and engineering courses.',
        canonical: null,
        type: 'website',
        noindex: true,
      }),
      body: [
        staticHeader,
        `\t\t\t<main id="static-content">\n\t\t\t\t<h1>Page Not Found</h1>\n\t\t\t\t<p>This page does not exist. <a href="/blog">Browse the System Design Tutorial series</a>.</p>\n\t\t\t</main>`,
        staticFooter,
      ].join('\n'),
    }),
    written,
    '(SPA fallback)'
  );

  /* True server-side 404 for every path not covered by a static page or one of
   * the explicit client-only rewrites in vercel.json. Vercel serves 404.html
   * with HTTP 404 automatically, eliminating the site's soft-404 catch-all. */
  writeFile(
    '404.html',
    renderPage(template, {
      head: headTags({
        title: 'Page Not Found',
        description: 'This page does not exist. Browse the System Design Tutorial series or course catalog.',
        canonical: null,
        type: 'website',
        noindex: true,
      }),
      body: [
        staticHeader,
        `\t\t\t<main id="static-content">
\t\t\t\t<p>404</p>
\t\t\t\t<h1>Page Not Found</h1>
\t\t\t\t<p>The page you are looking for does not exist or has moved.</p>
\t\t\t\t<p><a href="/blog">Browse tutorials</a> · <a href="/courses">View courses</a></p>
\t\t\t</main>`,
        staticFooter,
      ].join('\n'),
    }),
    written,
    '(404)'
  );

  const label = DRY_RUN ? 'would write' : 'wrote';
  console.log(`[prerender] ${label} ${written.length} static pages to ${path.relative(process.cwd(), DIST)}/`);
  console.log(`[prerender]   ${posts.length} blog posts, ${courses.length} courses, 7 core pages`);
  if (DRY_RUN) for (const w of written) console.log(`  ${w.route}  →  ${w.file}  (${w.bytes} bytes)`);
}

main().catch((e) => {
  console.error('[prerender] failed:', e.message);
  process.exit(1);
});
