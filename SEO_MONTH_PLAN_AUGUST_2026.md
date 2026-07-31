# August 2026 SEO plan — System Design course

## The article target

Publish **8 substantial articles this month (2 per week)**. There is no SEO rule that a
website needs a particular total number of articles. For this site, the useful target is a
focused cluster of **30–40 high-quality System Design pages over the next 6 months**, not a
large library of unrelated posts.

At the end of this release the crawlable cluster contains:

- 9 existing System Design tutorials
- 8 new long-form articles, each 1,400–1,900 words
- 1 focused course landing page
- 1 author and editorial-trust page

The eight generic template posts remain retained in the database, but they are removed from
the blog index, sitemap, and public crawl surface. Their old direct routes now return 404, so
they cannot dilute the System Design topic cluster and can still be recovered by an
administrator if needed.

## Business goal and funnel

**Goal:** attract software engineers preparing for System Design interviews and move
qualified readers to the Udemy course.

**Primary conversion:** click an attributed `rel="sponsored"` Udemy referral link.

**Funnel:**

1. Searcher lands on a specific tutorial or case study.
2. The article answers the query completely and links to prerequisite/next-step tutorials.
3. One contextual CTA offers the structured video course.
4. Course and About pages establish curriculum, instructor, and trust.

## Publishing calendar

All eight articles are publish-ready and are inserted idempotently during deployment.
Use the calendar below for the second distribution pass, internal-link refresh, and
Search Console inspection.

| Week | Article | Primary keyword | Search intent | Conversion angle |
|---|---|---|---|---|
| 1 | Consistent Hashing Explained | consistent hashing explained | Informational/interview | Course’s consistent-hashing deep dive |
| 1 | Master-Slave Replication | master slave replication | Informational/interview | Database and failure-mode curriculum |
| 2 | Social Bookmarking Service Design | social bookmarking system design | Case-study practice | Full course case study |
| 2 | Design a Coding Contest Platform | leetcode system design | Case-study practice | Queue, cache, judge, and leaderboard concepts |
| 3 | Design Facebook News Feed | facebook news feed system design | High-intent case study | Seven-lecture course section |
| 3 | Design Google Typeahead | typeahead system design | High-intent case study | Trie, sharding, and read/write trade-offs |
| 4 | System Design Interview Framework | system design interview framework | Interview preparation | Repeatable method taught across the course |
| 4 | Back-of-the-Envelope Estimation | back of the envelope estimation system design | Interview preparation | Capacity math that justifies architecture choices |

## Weekly execution

### Week 1 — foundation and discovery

- Deploy prerendering, real API routing, canonical cleanup, sitemap cleanup, and real 404s.
- Publish all eight reviewed articles through the deployment seed.
- Verify `/api/public/blog-posts`, one new article, the course page, `/about`, and a random
  nonexistent URL.
- Submit `sitemap.xml` in Google Search Console and submit all new URLs through IndexNow.
- Add UTM parameters only in channels where campaign attribution is needed; preserve the
  canonical Udemy referral URL on the website.

### Week 2 — internal authority and conversion

- Review the internal-link graph and add links from older tutorials to the new framework,
  estimation, hashing, and case-study pages.
- Confirm every article has one course CTA and 2–4 useful internal links.
- Compare article-to-Udemy outbound click rate by landing page.
- Improve the weakest CTA context, not the CTA volume.

### Week 3 — earned distribution

- Pitch the most linkable assets: the worked estimation example, interview framework, and
  consistent-hashing explanation.
- Send a small, personalized batch to relevant engineering newsletters, interview-prep
  resource pages, podcasts, and guest-post editors using `seo-pipeline/backlinks/`.
- Publish matching LinkedIn and YouTube community posts that teach one useful idea before
  linking to the article.
- Do not buy bulk backlinks, automate forum drops, or exchange sitewide links.

### Week 4 — measure and refresh

- In Search Console, inspect new-page indexing and queries with impressions.
- Prioritize pages ranking 5–20: improve title/description alignment, intro clarity, and
  internal anchors before creating more content.
- Compare System Design article sessions, engaged sessions, course clicks, and click-through
  rate with the prior 28 days.
- Refresh the next month’s queue from real query data. Keep at least 10 approved topics ready.

## On-page standard

Every article must keep:

- one descriptive H1 and a primary-keyword title under roughly 60 characters;
- a unique 120–160 character meta description;
- the primary query in the opening and one natural subheading;
- 1,300–1,900 words when the topic needs that depth;
- one worked example, analogy, or real failure mode;
- 2–4 descriptive internal links;
- exactly one sponsored Udemy CTA;
- author, published/modified dates, BlogPosting schema, breadcrumb schema, and descriptive
  image alt text.

## Technical standard

- Serve real per-route HTML, not one JavaScript shell for every URL.
- Keep the apex `https://anandrochlani.com` as the only canonical host.
- Return JSON from `/api/public/*` and a real HTTP 404 for unknown pages.
- Keep only indexable System Design pages in `sitemap.xml`.
- Block releases when titles, descriptions, canonicals, JSON-LD, H1s, image alt text, assets,
  or indexability regress.
- Run `npm run build`, `npm run seo:qa`, `npm run seo:links`, and
  `node tools/test-validators.mjs` before release.

## KPIs for the first month

Search Console and analytics are not connected in this workspace, so the first deployment
establishes the baseline. Record:

| KPI | Month-one target |
|---|---:|
| New System Design articles indexed | 8/8 |
| Valid indexable URLs with unique metadata | 100% |
| Article pages with course CTA and sponsored rel | 100% |
| Broken internal blog links | 0 |
| Queries with impressions | Baseline, then grow week over week |
| Organic clicks | Baseline, then grow week over week |
| Article-to-Udemy outbound click rate | Establish per-page baseline |
| Relevant outreach prospects contacted | 15–25 personalized contacts |
| Earned relevant links | 1–3 in month one; quality over count |

Do not use impressions or article count as the final success metric. The business metric is
qualified organic readers who click through to the System Design course.

## Next-month queue

Prioritize CAP theorem, SQL vs NoSQL, CDN, message queues, and rate limiting after Search
Console validates which existing pages and queries are gaining impressions.
