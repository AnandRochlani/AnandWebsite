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
- **one original diagram** (see below);
- only the `System Design` category.

The production build enforces these requirements. Off-topic template content stays outside
the index.

## Publishing cadence — does it matter if everything goes live in one day?

Google has no ranking factor for publishing frequency. A steady schedule is not rewarded
and a quiet month is not punished. But **how** you release still matters, for three
reasons that have nothing to do with a "consistency" signal:

1. **Scaled content abuse.** Google's spam policy targets mass-produced pages made
   primarily to rank. A low-authority domain that goes from 20 pages to 70 in a day, with
   uniform structure and length, matches that pattern — not because of the date, but
   because of the volume-to-quality shape. Twenty pages a week from a site with no link
   profile invites the wrong kind of review.
2. **You lose the feedback loop.** Publish 12 at once and you learn nothing until they
   are all indexed. Publish 2 a week and Search Console tells you which angles earn
   impressions while there is still a queue to redirect.
3. **Distribution bandwidth.** Every article deserves its own promotion push — a LinkedIn
   post, a newsletter mention, an outreach email. Twelve on one day means eleven get
   nothing, and promotion is what actually earns the links.

**The rule: draft in bulk, release on a schedule.** Writing ten articles in a weekend is
fine and efficient. Publishing them across five weeks at 2 per week is what to do with
them. A batch of 2–5 in one day is unremarkable; 20+ is a pattern.

Two things genuinely do not matter: the day of the week, and the time of day. Submit the
sitemap and ping IndexNow after each batch and discovery takes care of itself.

## Diagrams

Every article carries one original SVG diagram. This is a deliberate differentiator: the
competing pages are largely wall-of-text, diagrams are the most cited/linked asset type in
this topic, and an original image is something a competitor cannot copy without attribution.

**Visual language is carried over from the LLD Masterclass video decks** ("Daylight
Classroom"), so the blog and the courses look like one product: `#FAFAF5` paper, a kicker
over a bold heading with a short indigo underline bar, amber (`#B45309`) marker handwriting
for the human annotations, hand-drawn wobbly strokes and stamps, emerald for the good path
and red for the failure path, and a thin indigo footer band with a diagonal notch carrying
`anandrochlani.com · System Design Tutorial`.

The handwriting is the point, not decoration. A diagram that only draws boxes states the
architecture; a handwritten "adding servers here changes nothing" next to the app tier
teaches the lesson the article is actually about — and it is what makes the image worth
sharing. The footer band means every shared or hot-linked copy carries attribution back.

- Specs live in `seo-pipeline/diagrams/specs.mjs`; layouts (`flow`, `ring`, `compare`,
  `steps`, `triangle`) in `lib.mjs`. `npm run seo:diagrams` renders them.
- Output is **standalone `.svg` files** in `public/diagrams/`, referenced with
  `<img src="/diagrams/<id>.svg" alt="…">`. Standalone files are used rather than inline
  `<svg>` because Google Image Search indexes image files; inline SVG is not indexed as an
  image, and inline markup would bloat every article row in the database.
- Alt text must describe the diagram's content well enough to replace it. The generator
  refuses to build a spec whose alt text is missing or under 60 characters.
- `npm run seo:diagrams:inject` places each figure into its live post, idempotently
  (a post that already references its diagram id is skipped).
- Diagram generation runs as the first step of `npm run build`, so a spec change can never
  ship without its rendered file.
- Everything is deterministic (the wobble uses a seeded PRNG, never `Math.random`), so
  `npm run seo:diagrams:check` can fail a build whose SVGs are stale.

## How publishing actually works here

Worth writing down because it is not obvious: `src/data/seoArticles.js` reads every JSON in
`seo-pipeline/articles/` at build time. **Adding a draft file and deploying publishes it** —
it becomes a prerendered page and enters the sitemap via `npm run seo:sitemap`. It does not
need `publish.mjs`; that path exists to also write the post into Neon so the admin UI and
the public API agree.

The practical consequence for cadence (§ above): staged release means adding drafts to the
folder in batches of 2–5 and deploying, not writing ten and shipping them in one commit.

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
