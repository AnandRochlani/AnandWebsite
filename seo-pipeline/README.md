# SEO Pipeline — anandrochlani.com

Automated content pipeline that grows the **System Design Tutorial** blog series and funnels
readers to the Udemy course [System Design Fundamentals for Interviews](https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73).

## How it works

```
content-plan.json          the keyword-mapped queue (status: queued → drafted → published)
      │
      ▼  (Claude drafts per ARTICLE_SPEC.md — use the `seo-article` skill)
articles/<order>-<slug>.json
      │
      ▼  node seo-pipeline/qa.mjs            ← format/link/CTA/word-count gate
      ▼  node seo-pipeline/publish.mjs --yes ← idempotent create/update via admin API
      ▼  node seo-pipeline/generate-sitemap.mjs → public/sitemap.xml (commit + push)
```

## Commands

```bash
# 1. QA all drafts
node seo-pipeline/qa.mjs

# 2. Dry-run publish (shows CREATE/UPDATE plan, publishes nothing)
ADMIN_USERNAME=... ADMIN_PASSWORD=... node seo-pipeline/publish.mjs

# 3. Publish for real
ADMIN_USERNAME=... ADMIN_PASSWORD=... node seo-pipeline/publish.mjs --yes

# 4. Regenerate sitemap from live content, then commit + push
node seo-pipeline/generate-sitemap.mjs

# 5. Search Console (after one-time GSC_SETUP.md): resubmit sitemap + check coverage
node seo-pipeline/gsc.mjs submit
node seo-pipeline/gsc.mjs inspect     # per-URL index report → seo-pipeline/reports/
```

Credentials are the `ADMIN_USERNAME` / `ADMIN_PASSWORD` values configured in the Vercel
project env (same ones used by `/admin/login`). Never commit them.

## Cadence (recommended)

- **2 articles/week** from the queue, in series order — consistency beats bursts.
- After each publish: regenerate sitemap, commit, push (Vercel redeploys), then request
  indexing for the new URLs in Google Search Console.
- Update `content-plan.json` statuses as you go; append new topics to keep ≥10 queued.

## Backlogs (in content-plan.json)

- `expansionBacklog` — live tutorials 3–8 are thin (200–400 words); expand each to spec
  via `PUT /api/admin/blog-posts?id=<id>` (keep slug + order).
- `cleanupBacklog` — 8 template placeholder posts (React hooks, CSS grid, …) dilute the
  site's system-design topical authority; delete once the SD catalog is deeper.

## Off-repo levers (manual, one-time)

- Google Search Console: verify property + service account per `GSC_SETUP.md`; after that
  `gsc.mjs` handles sitemap submission and index monitoring. ("Request indexing" for a
  priority URL stays a manual UI click — it has no public API; the Indexing API is
  restricted to job postings/livestreams and must not be used for blog content.)
- **Canonical host is the apex `https://anandrochlani.com`** — `www.` is not attached in
  Vercel (connection refused). Either keep everything on apex (current code does), or add
  `www` in Vercel as a redirect to apex. Never point canonicals/sitemap at `www` while it
  doesn't resolve.
- Point new YouTube video descriptions at matching blog posts and vice versa.
- The SPA renders content client-side; Google handles it but indexing is slower. If rankings
  stall, consider prerendering blog routes (vite-ssg or a prerender step) — biggest single
  technical SEO upgrade available for this site.
