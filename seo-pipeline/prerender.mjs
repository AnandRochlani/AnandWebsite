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
const pageTitle = (t) => (t.includes(SITE_NAME) ? t : `${t} | ${SITE_NAME}`);

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
    tags.push(`<script type="application/ld+json" id="ld-prerender-${i}">${json}</script>`);
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
    description: post.description || clamp(post.content, 155),
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

  return `\t\t\t<main id="static-content">
\t\t\t\t<article id="static-blog-post-content">
\t\t\t\t\t<nav aria-label="Breadcrumb">
\t\t\t\t\t\t<a href="/">Home</a> / <a href="/blog">Blog</a> / <span>${esc(post.title)}</span>
\t\t\t\t\t</nav>
\t\t\t\t\t<h1>${esc(post.title)}</h1>
\t\t\t\t\t<p>${meta}</p>${img}
\t\t\t\t\t<p>${esc(post.description || '')}</p>
\t\t\t\t\t<div>
${sanitize(post.content || '')}
\t\t\t\t\t</div>
\t\t\t\t\t<p><a href="${esc(COURSE_URL)}" rel="noopener">Go deeper: System Design Fundamentals for Interviews on Udemy</a></p>${seriesNav(allPosts, post.slug)}
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
  return res.json();
}

async function main() {
  const templatePath = path.join(DIST, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error(`No build found at ${path.relative(process.cwd(), templatePath)}. Run \`npm run build\` first.`);
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, 'utf8');

  let posts = [];
  let courses = [];
  try {
    const [p, c] = await Promise.all([
      getJson(`${API_BASE}/api/public/blog-posts`),
      getJson(`${API_BASE}/api/public/courses`).catch(() => ({ courses: [] })),
    ]);
    posts = (p.posts || []).filter((x) => x && x.slug);
    courses = c.courses || [];
  } catch (e) {
    // A prerender failure must never break the deploy — the SPA shell still works.
    console.error(`[prerender] content fetch failed (${e.message}); leaving the SPA shell as-is.`);
    process.exit(0);
  }

  posts.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const written = [];

  /* home */
  write(
    '/',
    renderPage(template, {
      head: headTags({
        title: 'System Design Tutorials & Courses | AnandRochlani',
        description:
          'Free System Design tutorials for interview prep — caching, sharding, consistent hashing, load balancing and full case studies.',
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
        title: 'System Design Tutorial Series | AnandRochlani',
        description:
          'The complete System Design Tutorial series: latency, throughput, caching, sharding, replication, consistent hashing and real interview case studies.',
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

  /* one file per post */
  for (const post of posts) {
    const canonical = `${CANONICAL_HOST}/blog/${post.slug}`;
    write(
      `/blog/${post.slug}`,
      renderPage(template, {
        head: headTags({
          title: post.title,
          description: post.description || clamp(post.content, 155),
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
        title: 'Engineering Courses | AnandRochlani',
        description:
          'In-depth engineering courses, including System Design Fundamentals for Interviews — 49 lectures of practical system design training.',
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
          'Engineering Courses',
          'Practical, interview-focused courses.',
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

  for (const c of courses) {
    const name = c.name || c.title || `Course ${c.id}`;
    // CoursesPage links to the slug form, so that is the primary indexable URL.
    // The numeric /courses/<id> form is prerendered too (CourseDetail resolves both)
    // but canonicalises to the slug so the two do not compete as duplicates.
    const slug = c.slug || slugify(name);
    const canonical = `${CANONICAL_HOST}/courses/${slug}`;
    for (const routeKey of [slug, String(c.id)]) {
    write(
      `/courses/${routeKey}`,
      renderPage(template, {
        head: headTags({
          // Mirrors CourseDetail's SEOHead title so the prerendered and rendered
          // titles are identical.
          title: c.category
            ? `${name} - ${c.category} Course | Beginner to Advanced`
            : `${name} | ${SITE_NAME}`,
          description: c.description ? clamp(c.description, 155) : `${name} — an in-depth engineering course.`,
          canonical,
          image: c.image || c.thumbnail,
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
            },
            breadcrumb([
              { name: 'Home', url: `${CANONICAL_HOST}/` },
              { name: 'Courses', url: `${CANONICAL_HOST}/courses` },
              { name, url: canonical },
            ]),
          ],
        }),
        body: [
          staticHeader,
          `\t\t\t<main id="static-content">
\t\t\t\t<h1>${esc(name)}</h1>
\t\t\t\t<p>${esc(c.description ? clamp(c.description, 400) : '')}</p>
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

  const label = DRY_RUN ? 'would write' : 'wrote';
  console.log(`[prerender] ${label} ${written.length} static pages to ${path.relative(process.cwd(), DIST)}/`);
  console.log(`[prerender]   ${posts.length} blog posts, ${courses.length} courses, 4 core pages`);
  if (DRY_RUN) for (const w of written) console.log(`  ${w.route}  →  ${w.file}  (${w.bytes} bytes)`);
}

main().catch((e) => {
  console.error('[prerender] failed:', e.message);
  process.exit(1);
});
