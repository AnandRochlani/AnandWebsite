# SEO Pipeline — anandrochlani.com

End-to-end SEO for the **System Design Tutorial** series, funnelling readers to the Udemy
course [System Design Fundamentals for Interviews](https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73).

**New to SEO or backlinks? Read [GUIDE.md](GUIDE.md) first** — it explains how ranking and
backlinks actually work, in plain English, and why automated link-building software was
deliberately not built here.

## The four layers

| Layer | What it does | Module |
|---|---|---|
| **1. Technical** | Make pages readable by crawlers | `prerender.mjs`, `generate-sitemap.mjs`, `audit.mjs` |
| **2. Content** | Draft, QA and publish articles | `content-plan.json`, `qa.mjs`, `publish.mjs` |
| **3. Internal links** | Spread authority between your own pages | `internal-links.mjs`, `linking/` |
| **4. Off-page** | Earn backlinks from other sites | `backlinks/` |
| **Indexing** | Tell search engines about changes | `indexing/`, `gsc.mjs` |

Run any stage individually, or drive the whole thing with the orchestrator:

```bash
npm run seo check     # read-only: QA drafts + internal-link report + live audit
npm run seo build     # sitemap + production build + prerender
npm run seo submit    # IndexNow (dry run; add --yes to send)
npm run seo all       # check → build → submit
```

## Content flow

```
content-plan.json          keyword-mapped queue (status: queued → drafted → published)
      │
      ▼  (Claude drafts per ARTICLE_SPEC.md — use the `seo-article` skill)
articles/<order>-<slug>.json
      │
      ▼  node seo-pipeline/qa.mjs              ← format/link/CTA/word-count gate
      ▼  node seo-pipeline/internal-links.mjs  ← contextual internal links
      ▼  node seo-pipeline/publish.mjs --yes   ← idempotent create/update via admin API
      ▼  node seo-pipeline/generate-sitemap.mjs → public/sitemap.xml
      ▼  git push → Vercel builds → prerender.mjs writes static HTML per URL
      ▼  node seo-pipeline/audit.mjs           ← verify the live result
      ▼  node seo-pipeline/indexing/indexnow.mjs --new --yes
```

## Commands

```bash
# Content
node seo-pipeline/qa.mjs                                    # QA all drafts
ADMIN_USERNAME=... ADMIN_PASSWORD=... node seo-pipeline/publish.mjs        # dry run
ADMIN_USERNAME=... ADMIN_PASSWORD=... node seo-pipeline/publish.mjs --yes  # publish

# Technical
node seo-pipeline/generate-sitemap.mjs      # rebuild public/sitemap.xml from live content
node seo-pipeline/prerender.mjs             # static HTML per route (runs inside npm run build)
node seo-pipeline/audit.mjs                 # crawl live site, report CRITICAL/WARNING/PASS
node seo-pipeline/audit.mjs --base http://localhost:4180   # audit a local preview build

# Internal links
node seo-pipeline/internal-links.mjs                 # report only
node seo-pipeline/internal-links.mjs --apply --yes   # rewrite articles/*.json in place

# Indexing
node seo-pipeline/indexing/ping-sitemap.mjs          # sitemap + robots health check
node seo-pipeline/indexing/indexnow.mjs --new        # dry run
node seo-pipeline/indexing/indexnow.mjs --new --yes  # submit to Bing/Yandex
node seo-pipeline/gsc.mjs submit                     # Search Console sitemap submit
node seo-pipeline/gsc.mjs inspect                    # per-URL index report → reports/

# Off-page
node seo-pipeline/backlinks/outreach.mjs due         # what to send today
node seo-pipeline/backlinks/monitor.mjs              # verify earned links are still live
```

Credentials are the `ADMIN_USERNAME` / `ADMIN_PASSWORD` values configured in the Vercel
project env (same ones used by `/admin/login`). Never commit them.

## Technical invariants — do not regress these

These were all broken and have been fixed. `audit.mjs` fails loudly if any regress.

1. **Canonical host is the apex `https://anandrochlani.com`.** `www.` is not attached in
   Vercel and fails its TLS certificate. Nothing — canonical, `og:url`, sitemap, robots —
   may ever point at `www` while that is true. Either keep everything on apex, or attach
   `www` in Vercel as a redirect to apex first.
2. **Every indexable route ships real HTML.** `prerender.mjs` runs as part of
   `npm run build` and writes `dist/<route>/index.html` with a unique title, description,
   canonical, Open Graph tags, JSON-LD and the full article text. Vercel checks the
   filesystem before applying the SPA rewrite, so those files are served directly. Do not
   remove the prerender step from `build`.
3. **Unknown paths must not be indexable.** The SPA rewrite answers HTTP 200 for any path,
   so `vercel.json` points its catch-all at `dist/app-shell.html`, which is
   `noindex, follow` with no canonical, and React renders `NotFoundPage`. Pointing the
   catch-all back at `/index.html` would make every mistyped URL an indexable homepage
   duplicate.
4. **JSON-LD is emitted once.** Prerendered blocks carry `id="ld-prerender-N"`; `SEOHead`
   detects them and skips its own client-side fallback so pages never carry two graphs.

## Cadence

- **2 articles/week** from the queue, in series order — consistency beats bursts.
- After each publish: internal links → sitemap → commit → push → audit → IndexNow, then
  request indexing for the new URL in Search Console.
- **Weekly:** `node seo-pipeline/backlinks/outreach.mjs due`.
- **Monthly:** `npm run seo:audit`, `npm run seo:backlinks`, and review Search Console for
  queries ranking 5–15 — the cheapest wins available.
- Keep ≥10 topics queued in `content-plan.json`.

## Backlogs (in content-plan.json)

- `expansionBacklog` — live tutorials 3–8 are thin (200–400 words); expand each to spec
  via `PUT /api/admin/blog-posts?id=<id>` (keep slug + order).
- `cleanupBacklog` — 8 template placeholder posts (React hooks, CSS grid, D3, …) dilute the
  site's system-design topical authority. They are currently prerendered and indexed like
  everything else, so they actively cost topical focus; delete them once the System Design
  catalog is deeper.

## Off-repo levers (manual, one-time)

- **Google Search Console** — verify the property and service account per `GSC_SETUP.md`
  (or the beginner walkthrough in `indexing/gsc-setup.md`); after that `gsc.mjs` handles
  sitemap submission and index monitoring. "Request indexing" for a priority URL stays a
  manual UI click — it has no public API, and the Indexing API is restricted to job
  postings/livestreams and must not be used for blog content.
- **IndexNow key** — `public/<key>.txt` must be deployed before submissions work; the
  script preflights it and refuses to submit otherwise.
- Point new YouTube video descriptions at matching blog posts, and vice versa.
