# SEO Strategy — anandrochlani.com

**Owner:** Anand Rochlani · **Updated:** 31 July 2026
**Business goal:** attract qualified System Design learners and send them to the Udemy
course through useful, trustworthy content.

Companion documents:
[SEO_AUDIT_2026-07-31.md](SEO_AUDIT_2026-07-31.md),
[SEO_MONTH_PLAN_AUGUST_2026.md](SEO_MONTH_PLAN_AUGUST_2026.md), and
[seo-pipeline/ARTICLE_SPEC.md](seo-pipeline/ARTICLE_SPEC.md).

## How many articles?

There is no SEO-required article count. For this site, use:

- **2 high-quality articles per week** during the first month;
- **30–40 focused System Design pages** within six months;
- **60–80 pages only if distinct, evidence-backed search demand supports them** over the
  next 12–18 months.

Do not publish a second page for a keyword already owned by a strong page. Expand or merge
instead. Every article must answer a distinct query, connect to the topic cluster, and earn
its place through depth, an example, a diagram, a framework, or a useful checklist.

## Current crawlable architecture

```text
Course landing page
        ↑
Interview-prep pillar
  ├─ Foundation tutorials
  ├─ Interview framework and estimation
  ├─ Concept and comparison articles
  ├─ Case-study hub → five complete case studies
  └─ Roadmap, glossary, and downloadable checklist
```

The release contains 29 canonical URLs and 21 System Design articles. All nine original
tutorials are expanded in place, and twelve newer articles cover interview preparation,
capacity estimation, consistent hashing, replication, CAP theorem, SQL vs NoSQL, latency
vs throughput, and five case studies.

## Publishing standard

Every article must include:

- one clear H1 and one distinct primary query;
- a unique 30–60 character search title and useful meta description;
- at least 1,200 words, normally 1,300–1,900;
- a worked example, analogy, calculation, or failure mode;
- 2–8 contextual internal links, with higher counts only for pillar pages;
- exactly one Udemy CTA qualified with `rel="sponsored noopener noreferrer"`;
- author and date information, BlogPosting schema, breadcrumbs, and descriptive image alt;
- only the `System Design` category.

The production build enforces these requirements. Off-topic template content stays outside
the index.

## Six-month content direction

| Month | Primary work |
|---|---|
| Aug 2026 | Distribute and measure the 12 new articles; submit sitemap; establish baselines. |
| Sep | CDN, message queues, rate limiting, database indexing, polling vs WebSockets. |
| Oct | WhatsApp, Instagram, YouTube, Uber, and web-crawler case studies. |
| Nov | Notifications, idempotency, and the highest-impression Search Console opportunities. |
| Dec | Refresh pages ranking 5–20; add diagrams and worked calculations to top pages. |
| Jan 2027 | Consolidate cannibalizing pages, refresh pillars, and improve course conversion. |

From the moment Search Console data is available, it overrides the speculative queue.
Prioritize pages already ranking 5–20 before creating another page on a nearby query.

## Distribution and links

Use the interview framework, estimation guide, roadmap SVG, checklist, and case-study hub
as linkable assets. Aim for 15–25 personalized contacts and 1–3 relevant earned links per
month through engineering newsletters, university or bootcamp resource pages, podcasts,
and genuine guest contributions.

Do not buy links, use private blog networks, automate forum drops, or submit to bulk
directories. Outreach requires explicit access to the sender’s account and backlinks
remain third-party outcomes.

## Measurement

Track weekly:

- impressions and clicks by query and page;
- pages ranking 5–20;
- search CTR;
- indexed versus submitted URLs;
- organic sessions and engagement;
- Udemy outbound click rate by landing page;
- referring domains and accepted outreach.

Search Console and GA4 access are external dependencies. Do not claim those measurements
until the real properties are connected.

## Release workflow

Run:

```bash
npm run seo:sitemap
npm run build
npm run lint
npm run seo:qa
npm run seo:links
node tools/test-validators.mjs
npm run seo:audit
npm run seo:indexnow -- --yes
```

Commit sitemap and IndexNow state changes after successful production verification.
