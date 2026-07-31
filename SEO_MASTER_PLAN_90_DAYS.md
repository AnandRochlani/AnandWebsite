# anandrochlani.com — 90-Day SEO Master Plan (3 Aug – 1 Nov 2026)

**Owner:** Anand Rochlani · **Written:** 31 July 2026
**Goal:** build an organic acquisition channel for the *System Design Fundamentals for
Interviews* Udemy course, and lay the foundation for the LLD, Amazon and Google courses.

Supersedes the month-plan in `SEO_MONTH_PLAN_AUGUST_2026.md` for the Aug–Oct window.
`SEO_STRATEGY.md` remains the 6-month direction; this document is the execution layer.

---

## 1. Where the site actually stands today (measured, not assumed)

| Signal | Value | Source |
|---|---|---|
| Ahrefs Domain Rating | **0** | Ahrefs public DR API, 31 Jul 2026 |
| Indexable URLs in sitemap | 37 | live `sitemap.xml` |
| Published System Design articles | 21 | live API |
| Published Coding Interview articles | 2 | live API |
| Course landing pages | 3 (System Design, Amazon, Google) | live sitemap |
| LLD course landing page | **none** | — |
| Search Console property | **not connected in this repo** (no service-account key present) | `seo-pipeline/` |
| GA4 | not installed | repo |
| Original diagrams generated / injected live | 25 / 0 | `reports/diagram-injection.json` |
| Internal links proposed / applied | 22 / 0 | `reports/internal-links.json` |

**DR 0 is the number that governs everything below.** It does not mean the site is bad; it
means Ahrefs has found effectively no external links pointing at it. Every forecast,
keyword choice and cadence decision in this plan follows from it.

### Who you are competing with

| Competitor | DR | What they own |
|---|---:|---|
| educative.io | **77** | every "grokking"-style concept query |
| bytebytego.com | **72** | the canonical "design a X" case studies |
| tryexponent.com | **66** | interview-guide head terms |
| designgurus.io | **56** | question lists, LLD answers, blog |
| algomaster.io | **55** | solo-founder site — proof this is winnable |
| hellointerview.com | **52** | problem breakdowns, "in a hurry" hub |
| systemdesign.one | **52** | long-tail concept pages |
| systemdesignschool.io | **51** | per-problem solution pages |
| interviewready.io | **41** | India-facing system design |
| codemia.io | **34** | practice problems |

Plus GeeksforGeeks, InterviewBit, Medium, GitHub and Reddit occupy 3–5 slots on almost
every SERP in this niche. On "design a rate limiter", 9 of the 9 visible results were
DR 34+ sites, GitHub, or Medium.

**Conclusion: no head term in this niche is winnable in 90 days.** Anyone who tells you
otherwise is selling something. What *is* winnable in 90 days is (a) the long tail nobody
has written a dedicated page for, (b) the LLD cluster, which is materially less
consolidated than System Design, and (c) brand/commercial queries about your own course.

---

## 2. The three constraints that shape the plan

**1. New pages rank slowly now.** Ahrefs' study of ranking age found only **1.74%** of pages
published in a given month reached a top-10 position within a year (down from 5.7% in
2017), **72.9%** of top-10 pages are over 3 years old, and the pages that do move fast take
**61–182 days**. A page you publish in August is expected to be at its 90-day position in
early November — which is exactly where this plan ends. Judge August's articles in
November, not in August.

**2. AI Overviews eat informational clicks.** AI Overviews appear on roughly **36% of
informational queries**, and informational queries carrying an AIO have shown organic CTR
declines of up to **61%**. Almost every keyword in this niche is informational. This is
priced into the forecast below, and it changes tactics: being *cited inside* the AI answer
is now worth more than position 6, because cited brands earn ~120% more clicks per
impression than uncited ones on those queries. See §7.

**3. Your Udemy economics reward referral traffic enormously.** Udemy pays instructors
**97%** on sales made through an instructor coupon/referral link versus **37%** on organic
Udemy traffic. Every CTA on this site must carry `?referralCode=4D123B9F202E6D906A73`.
One blog-driven sale is worth ~2.6 Udemy-driven sales to you. This is the whole financial
case for the blog.

---

## 3. Traffic forecast — what 90 days actually buys

The model is bottom-up: pages × expected position band × CTR at that band × AIO discount,
plus incidental long-tail queries each page picks up. All ranges assume the plan below is
executed and **1–3 genuine referring domains are earned per month**.

### Organic clicks per month, from Google

| Month | Pessimistic | **Realistic** | Optimistic | What is happening |
|---|---:|---:|---:|---|
| Aug 2026 (M1) | 15 | **40** | 120 | Existing 23 articles finish indexing; first impressions appear |
| Sep 2026 (M2) | 60 | **140** | 350 | August pages enter positions 20–50; a few long-tails hit page 2 |
| Oct 2026 (M3) | 150 | **320** | 700 | ~18 pages in positions 5–20; LLD cluster starts registering |
| Jan 2027 (M6) | 600 | **1,600** | 3,500 | August–October pages hit their 6-month position |
| Jul 2027 (M12) | 2,500 | **7,000** | 15,000 | Compounding; requires 25+ referring domains and ~80 pages |

**Impressions** will look far better than clicks and will be your real early signal:
expect ~1,500 (M1) → ~12,000 (M2) → ~40,000 (M3) monthly impressions in the realistic case.
Do not celebrate impressions; use them to pick what to write next.

### What that means in money (realistic case)

```
Month 3:  320 organic clicks
        × 10%  click the course CTA        =  32 Udemy visits
        ×  6%  purchase                    =  ~2 sales
        × ~$13 net at 97% instructor share =  ~$26 for the month
```

**Read that number carefully. SEO will not pay you back inside 90 days.** It is a
12–18 month compounding asset: the same 51 pages that produce ~$26 in October produce
~$600–800/month by mid-2027 if links keep arriving. The correct 90-day success metrics are
therefore *leading* metrics — indexed pages, impressions, queries in positions 5–20,
referring domains — not revenue.

**The 90-day revenue channel is not SEO — it is your existing video library.** You already
have 13 rendered LLD lecture videos and a YouTube channel. Publishing those with course
links in the description will out-earn the blog by an order of magnitude this quarter,
*and* it feeds SEO (brand searches, embedded video on article pages, natural links). That
is why YouTube tasks are inside this SEO plan rather than parked beside it.

---

## 4. Keyword strategy

### 4.1 Portfolio rule

Four clusters, deliberately unequal weight:

| Cluster | Weight (Aug–Oct) | Why |
|---|---:|---|
| **C — Low-Level Design (LLD/OOD)** | **40%** | Least consolidated SERP, you have a 45-lesson course + rendered videos, and no one on the site targets it yet. This is the wedge. |
| **A — System Design long tail** | 35% | 23 pages of topical authority already built; extend, do not restart |
| **D — Interview-prep meta & decision queries** | 20% | Cheapest wins for a DR-0 domain; strong internal-link glue |
| **B/E — Amazon / Google coding interview** | **5%** | See warning below |

> **Warning on the Amazon and Google clusters.** These are the most brutally contested
> keywords in the entire developer-education space — igotanoffer, educative, designgurus,
> interviewbit, geeksforgeeks, codechef and LinkedIn own them, and Amazon/Google queries
> attract the largest AI Overview coverage of anything you target. You also do not yet have
> a purchasable Amazon or Google course, so traffic there cannot convert. **Do not spend
> Aug–Oct writing into these clusters.** Keep the two existing articles, fix the two course
> pages (§6.4), and revisit in Q1 2027 when the courses exist.

### 4.2 Volume estimates — read this before using the tables

The Ahrefs API key attached to this session is on a plan that rejects Keywords Explorer
(`Insufficient plan`), so **the volumes below are estimates**, derived from SERP
composition, result counts, autocomplete breadth and category knowledge — not from a
metrics API. They are good enough to *rank-order* work and not good enough to quote to
anyone. Week 1, Day 2 of the plan is a verification pass in Google Keyword Planner (free
with any Google Ads account, no spend required) and the free Ahrefs Keyword Generator.

Difficulty column: **E** = a DR-0 site can plausibly reach page 1 in 3–6 months ·
**M** = page 1 in 6–12 months with links · **H** = not before 12–18 months.

---

### Cluster C — Low-Level Design (the wedge) — 40% of effort

| # | Keyword | Est. vol/mo (global) | Diff | Status |
|---|---|---:|:--:|---|
| C1 | low level design interview questions | 3–6K | M | **write — pillar** |
| C2 | low level design interview preparation | 1–2K | E | write |
| C3 | design a parking lot system low level design | 2–4K | E | write |
| C4 | design elevator system low level design | 1–2K | E | write |
| C5 | machine coding round preparation | 800–1.5K | **E** | write |
| C6 | design patterns for interviews | 1–3K | M | write |
| C7 | solid principles explained with examples | 8–15K | M | write |
| C8 | strategy pattern real world example | 1–2K | E | write |
| C9 | factory pattern vs abstract factory | 1–2K | E | write |
| C10 | observer pattern explained java | 1–2K | E | write |
| C11 | singleton pattern thread safe java | 1–2K | E | write |
| C12 | design a vending machine low level design | 700–1.5K | **E** | write |
| C13 | design tic tac toe low level design | 600–1.2K | E | write |
| C14 | design a library management system oops | 500–1K | **E** | write |
| C15 | design splitwise low level design | 400–900 | **E** | write |
| C16 | design an atm machine low level design | 400–800 | **E** | write |
| C17 | design snake and ladder game oop | 300–700 | **E** | write |
| C18 | uml class diagram for interviews | 800–1.5K | E | write |
| C19 | lld vs hld difference | 1–2K | **E** | write |
| C20 | how to approach a low level design interview | 500–1K | E | write |
| C21 | low level design roadmap | 400–900 | **E** | write |
| C22 | concurrency in low level design interview | 300–600 | E | write |
| C23 | best low level design course | 300–700 | **E** | commercial — write |
| C24 | design bookmyshow low level design | 500–1K | E | Q4 |
| C25 | design a chess game object oriented design | 400–800 | E | Q4 |

*Every one of C3, C4, C12–C17 maps to a lesson you have already scripted and rendered as a
video. Article + embedded video + original diagram on a page nobody else has bothered to
make properly is the single highest-leverage thing on this list.*

---

### Cluster A — System Design long tail — 35% of effort

Already owned (do not write again — refresh instead): consistent hashing, master-slave
replication, CAP theorem, SQL vs NoSQL, latency vs throughput, load balancing, caching,
sharding, microservices, CDN, message queues, rate limiter, database indexing, URL
shortener, del.icio.us, LeetCode contest, FB news feed, Google typeahead, estimation,
framework, prep pillar.

| # | Keyword | Est. vol/mo | Diff | Status |
|---|---|---:|:--:|---|
| A1 | websockets vs polling vs sse | 2–4K | E | queued (order 26) |
| A2 | whatsapp system design | 3–6K | M | queued (27) |
| A3 | instagram system design | 3–6K | M | queued (28) |
| A4 | youtube system design | 3–5K | M | queued (29) |
| A5 | uber system design | 4–8K | M | queued (30) |
| A6 | web crawler system design | 2–4K | M | queued (31) |
| A7 | notification system design | 2–3K | E | queued (32) |
| A8 | idempotency in distributed systems | 1–2K | **E** | queued (33) |
| A9 | database sharding vs partitioning | 1–3K | E | write |
| A10 | eventual consistency vs strong consistency | 1–2K | E | write |
| A11 | api gateway vs load balancer | 2–4K | E | write |
| A12 | read heavy vs write heavy system design | 300–800 | **E** | write |
| A13 | how to design for 1 million users | 500–1K | E | write |
| A14 | single point of failure system design | 400–900 | **E** | write |
| A15 | bloom filter system design | 800–1.5K | E | write |
| A16 | leader election distributed systems | 700–1.5K | E | Q4 |
| A17 | quorum in distributed systems | 500–1K | E | Q4 |
| A18 | design google docs collaborative editing | 1–2K | M | Q4 |
| A19 | design a payment system idempotency | 800–1.5K | M | Q4 |
| A20 | design ticketmaster concurrency | 600–1.2K | M | Q4 |

---

### Cluster D — Interview-prep meta & decision queries — 20% of effort

The cheapest wins available to a DR-0 domain. Low volume individually, high intent,
few dedicated pages exist, and they interlink the whole site.

| # | Keyword | Est. vol/mo | Diff | Status |
|---|---|---:|:--:|---|
| D1 | system design interview preparation 30 day plan | 400–900 | **E** | write |
| D2 | how much system design for sde 2 | 200–500 | **E** | write |
| D3 | system design interview for 3 years experience | 300–700 | **E** | write |
| D4 | system design interview mistakes to avoid | 400–800 | **E** | write |
| D5 | how to structure a 45 minute system design interview | 200–500 | **E** | write |
| D6 | system design interview cheat sheet | 1–3K | E | write (linkable asset) |
| D7 | best system design course udemy | 300–800 | **E** | **commercial — write** |
| D8 | system design interview book vs course | 200–400 | **E** | write |
| D9 | is system design asked for freshers | 300–700 | **E** | write |
| D10 | system design numbers every engineer should know | 500–1K | E | write (linkable asset) |
| D11 | system design interview questions for indian companies | 300–700 | **E** | write |
| D12 | free system design resources | 800–2K | E | write (link magnet) |

---

### Cluster B/E — Amazon / Google — 5% of effort, maintenance only

| # | Keyword | Est. vol/mo | Diff | Action |
|---|---|---:|:--:|---|
| B1 | amazon coding interview questions | 8–15K | **H** | keep existing page, refresh only |
| B2 | google coding interview questions | 6–12K | **H** | keep existing page, refresh only |
| B3 | amazon sde 2 system design interview | 500–1K | E | write **once** in Oct — bridges to your live course |
| B4 | leetcode patterns | 10–20K | **H** | existing page; do not expand |
| B5 | sliding window / two pointers / binary search patterns | 3–8K each | **H** | staged drafts — **hold, do not publish this quarter** |

Holding B5 is deliberate: three near-identical pattern pages from a DR-0 site into the most
saturated SERP in tech education is spend with no expected return, and it dilutes the
site's topical focus at exactly the moment you want it concentrated on design.

---

## 5. Content architecture to build

```
/                        home
└── /system-design-interview-preparation      ← PILLAR 1 (exists)
    ├── concepts        (13 pages, exist)
    ├── case studies    (5 pages, exist) → /system-design-case-studies hub (exists)
    └── meta/decision   (Cluster D, new)
└── /low-level-design-interview-preparation   ← PILLAR 2 (NEW — build Week 2)
    ├── design patterns (Cluster C6–C11)
    ├── LLD problems    (Cluster C3,C4,C12–C17) → /lld-problems hub (NEW)
    └── LLD meta        (C19–C22)
└── /courses/system-design-fundamental        ← money page
└── /courses/low-level-design                 ← NEW money page (Week 3)
```

Two pillars, two hubs, every article links up to its pillar and sideways to two siblings.
That structure is what converts 50 scattered posts into a topic Google can rank.

---

## 6. Technical & foundation work (Weeks 1–3, then done)

### 6.1 Blocking — nothing else matters until these are live

1. **Verify Search Console** for `https://anandrochlani.com`, submit `/sitemap.xml`.
   Without it you are flying blind for the entire quarter. Re-create the service-account
   key (`seo-pipeline/GSC_SETUP.md`) — it is not present in this working copy.
2. **Install GA4** (or Plausible/Umami if you prefer no consent banner) and add an outbound
   click event on every Udemy CTA. You cannot optimise conversion you cannot see.
3. **Verify Bing Webmaster Tools** — free, and it feeds ChatGPT/Copilot search results.
4. **Supply `ADMIN_USERNAME` / `ADMIN_PASSWORD`** so the pipeline can finish two jobs that
   are built and waiting: injecting the 25 diagrams (`npm run seo:diagrams:inject -- --yes`)
   and applying the 22 internal links (`seo-pipeline/internal-links.mjs --apply --yes`).

### 6.2 High value, low effort

5. Add `www` in Vercel as a 301 → apex (currently refuses connections).
6. Add **VideoObject schema** to every article that embeds one of your lecture videos.
7. Add **Course schema** to the LLD course page when it ships.
8. Run `npm run seo:audit` + Core Web Vitals check on the three heaviest pages.
9. Add an author byline + `Person` schema linking to your Udemy, LinkedIn, GitHub and
   YouTube profiles on every article (E-E-A-T; you are a real instructor — say so on-page).

### 6.3 Ongoing hygiene

10. `npm run seo:sitemap` after every publish batch; `npm run seo:indexnow -- --yes` after
    every deploy.
11. Never publish a page without its original diagram — the diagram is your only asset a
    competitor cannot copy without carrying your attribution footer.

### 6.4 Fix the two orphan course pages

`/courses/amazon-coding-interview-patterns` and `/courses/google-coding-interview-50-problems`
are indexed landing pages for products that cannot be bought. That is thin, and it is a
conversion dead end. Pick one per page:

- **Preferred:** convert to a genuine "coming soon + email waitlist" page with real
  curriculum detail and a signup form — this builds the launch list you will want anyway.
- **Otherwise:** `noindex` them until the courses exist.

Do this in Week 1. Ten minutes of work, removes a real quality signal problem.

---

## 7. Ranking inside AI answers (this is not optional in 2026)

With 36% of informational queries carrying an AI Overview and up to a 61% CTR haircut when
one appears, the practical target for many of your keywords is *citation*, not position.
What earns citations:

- **Answer-first paragraphs.** Every article opens with a 40–60 word direct answer to the
  exact query, before the analogy or the story. Your current articles cold-open on the
  failure — keep that as the *second* block and put the extractable answer first.
- **Original numbers.** AI answers cite sources that contain specific, quotable figures.
  Your back-of-the-envelope estimation content is perfect raw material; add a
  "numbers every engineer should know" reference page (D10).
- **Clean structured data** — `FAQPage`, `HowTo`, `DefinedTerm`, `VideoObject`. Already
  partly in place.
- **Tables and definition lists** — these get lifted verbatim far more often than prose.
- **Be the primary source.** Original diagrams, original worked calculations and original
  interview frameworks are citable; a paraphrase of ByteByteGo is not.
- Track it: search your top 20 queries monthly in Google, ChatGPT and Perplexity and log
  whether you are cited. This is now a KPI (§9).

---

## 8. Authority building — how a DR-0 domain stops being DR 0

Target: **1–3 quality referring domains per month → DR 8–15 by 1 Nov 2026.** That is a
realistic, honest target. Anyone promising DR 30 in a quarter is describing link buying,
which for a domain whose whole purpose is funnelling to a course is an unacceptable risk.

**Ranked by expected value for your specific situation:**

1. **Ship the LLD videos to YouTube (highest leverage, do first).** You have 13 rendered
   lectures sitting on disk. YouTube results appear directly in Google SERPs for LLD
   queries, the channel drives branded search (a real ranking input), and each video gets
   embedded on its matching article — which increases dwell time and gives you
   `VideoObject` rich results. Two uploads a week for the whole quarter.
2. **Open-source a GitHub repo: `low-level-design-solutions`** (Java, one folder per LLD
   problem, UML + code + link to the article). Note that a GitHub repo ranked #2 for
   "low level design interview questions" in the live SERP. Repos earn stars, get linked
   from awesome-lists and newsletters, and are the most natural link source in this niche.
   Link from README to the matching article — this is normal, expected, and not spam.
3. **Free tools as link magnets.** Two, both cheap to build with your stack:
   a capacity-estimation calculator (QPS/storage/bandwidth from DAU) and an
   LLD design-pattern picker. Tools attract links that articles never will.
4. **Genuine community participation.** r/leetcode, r/cscareerquestions, r/developersIndia,
   Discord/Slack interview communities, LinkedIn. Answer questions properly, link only when
   the link is the answer. Budget 20 min/day. This is also your fastest traffic source
   this quarter — it will beat Google until roughly month 5.
5. **Canonical-safe syndication.** Republish articles on dev.to, Hashnode and Medium with
   `rel=canonical` back to your page (all three support it). No duplicate-content risk,
   real referral traffic, occasional links from people who find you there.
6. **Newsletter and podcast outreach.** 15–25 personalised contacts a month to engineering
   newsletters, university/bootcamp resource pages and interview-prep podcasts. Lead with
   the diagram library or the free tool, not with "please link to my blog".
7. **Guest contributions** where you actually have standing — you build SCORM/e-learning
   for enterprise clients and teach three courses. That is a real credential; use it.

**Never:** bought links, PBNs, automated forum/comment drops, bulk directories,
link exchanges. On a domain that exists to sell a course, a manual action is not a
setback — it is the end of the channel.

---

## 9. Measurement — the only numbers that matter this quarter

Weekly, every Sunday, 20 minutes, into a running sheet:

| Metric | Aug target | Sep target | Oct target |
|---|---:|---:|---:|
| Indexed pages (GSC) | 37 | 47 | 60 |
| Impressions / month | 1,500 | 12,000 | 40,000 |
| Clicks / month | 40 | 140 | 320 |
| Queries in positions 5–20 | 5 | 20 | 45 |
| Referring domains (Ahrefs) | 2 | 5 | 9 |
| Domain Rating | 3 | 7 | 10 |
| AI-answer citations (top-20 queries) | 0 | 2 | 5 |
| Udemy CTA clicks | 10 | 40 | 90 |
| YouTube subscribers | 50 | 200 | 500 |

**Decision rules, applied at each month end:**
- Any page with impressions but position 8–20 → refresh it *before* writing anything new.
  Refreshing a position-12 page beats a new page every single time.
- Any query with >200 impressions and no dedicated page → that is your next article,
  regardless of what the queue says.
- Two pages competing for one query → merge and 301, do not let them cannibalise.
- If a cluster gets zero impressions after 60 days, stop feeding it.

---

## 10. The 90-day calendar

### Weekly rhythm (≈ 8–10 hrs/week)

| Day | Time | Work |
|---|---:|---|
| **Mon** | 60 min | **Publish day.** Deploy the week's articles, run `seo:sitemap` + `seo:indexnow`, request indexing in GSC. |
| **Tue** | 60 min | **Distribution.** LinkedIn post on the new article, syndicate to dev.to/Hashnode with canonical, share in 1–2 communities. |
| **Wed** | 90 min | **Write** article A (draft + diagram spec). |
| **Thu** | 60 min | **Links.** 5 personalised outreach emails, 20 min of genuine community answering, log in `backlinks/`. |
| **Fri** | 90 min | **Write** article B (draft + diagram spec) → QA gate. |
| **Sat** | 60 min | **Video.** Upload/schedule one lecture, write description + timestamps, embed on the matching article. |
| **Sun** | 20 min | **Measure.** Update the scorecard; pick next week's two topics from GSC data. |

Cadence: **2 articles/week baseline; 3 in weeks where the third is an LLD page** (a
genuinely new cluster with distinct queries). ~28 new articles across the quarter → ~51
total. That is a normal editorial pace, not a scaled-content pattern.

---

### Month 1 — August: foundations, LLD launch, measurement (Weeks 1–4)

**Week 1 (Aug 3–9) — day by day, because it is all setup**

| Day | Task |
|---|---|
| Mon 3 | Verify Search Console; submit sitemap; verify Bing Webmaster. |
| Tue 4 | Verify keyword estimates in Google Keyword Planner; correct the tables in §4. |
| Wed 5 | Install GA4 + outbound-click event on Udemy CTAs; add `www` → apex redirect. |
| Thu 6 | Supply admin creds; inject 25 diagrams; apply 22 internal links; redeploy. |
| Fri 7 | Fix the two orphan course pages (waitlist or noindex); add author/`Person` schema. |
| Sat 8 | Upload LLD video #1 to YouTube; write description + course link. |
| Sun 9 | Baseline scorecard: record every metric in §9 at its true starting value. |

**Week 2 (Aug 10–16)** — Publish **LLD pillar** (C1) + **C19 LLD vs HLD**. Build
`/low-level-design-interview-preparation` and the `/lld-problems` hub. Create the GitHub
repo `low-level-design-solutions` with the first 3 problems. YouTube #2.

**Week 3 (Aug 17–23)** — Publish **C3 parking lot** + **C5 machine coding round** +
**C2 LLD prep guide**. Ship the `/courses/low-level-design` landing page with Course schema.
YouTube #3. First 5 outreach emails (target: LLD-focused newsletters).

**Week 4 (Aug 24–30)** — Publish **C7 SOLID principles** + **C12 vending machine**.
Build the capacity-estimation calculator tool. YouTube #4. Month-1 review: apply the §9
decision rules for the first time.

---

### Month 2 — September: depth in both pillars, first refreshes (Weeks 5–8)

| Week | Publish | Also |
|---|---|---|
| **5** (Aug 31–Sep 6) | C6 design patterns for interviews · A1 websockets vs polling | Syndication engine live (dev.to + Hashnode, canonical) · YouTube #5–6 |
| **6** (Sep 7–13) | C8 strategy pattern · C4 elevator system · D1 30-day plan | **First refresh pass**: any page in positions 8–20 from GSC · outreach ×5 |
| **7** (Sep 14–20) | C18 UML for interviews · A8 idempotency | LLD design-pattern picker tool · YouTube #7–8 |
| **8** (Sep 21–27) | C9 factory patterns · C15 splitwise · D6 cheat sheet (gated PDF → email list) | Month-2 review · re-prioritise §4 tables from real GSC queries |

From Week 6 onward, **Search Console data overrides these tables**. If GSC says people are
finding you for something not on this list, that thing wins.

---

### Month 3 — October: consolidate, convert, compound (Weeks 9–13)

| Week | Publish | Also |
|---|---|---|
| **9** (Sep 28–Oct 4) | C10 observer pattern · A11 API gateway vs load balancer | Conversion pass: CTA placement + copy A/B on the 5 highest-traffic pages |
| **10** (Oct 5–11) | C13 tic tac toe · D4 interview mistakes · C20 how to approach LLD | Outreach push ×10 (tools + diagram library as the hook) |
| **11** (Oct 12–18) | C14 library management · A9 sharding vs partitioning | **Refresh sprint**: rewrite the 5 best-performing August pages with new sections + video embeds |
| **12** (Oct 19–25) | C11 singleton · D10 numbers every engineer should know | AI-citation audit across top 20 queries (Google/ChatGPT/Perplexity) |
| **13** (Oct 26–Nov 1) | C21 LLD roadmap · B3 Amazon SDE-2 system design | **Quarter review**: full §9 scorecard vs targets; write the Nov–Jan plan from real data |

---

## 11. What I need from you to unblock the plan

| # | Blocker | Impact if not resolved |
|---|---|---|
| 1 | Search Console verification + service-account key | No data all quarter; the whole plan runs blind |
| 2 | `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 25 diagrams and 22 internal links stay unpublished |
| 3 | Decision on the Amazon/Google course pages (waitlist vs noindex) | Thin pages on a small site |
| 4 | Go-ahead to publish the LLD videos to YouTube | Loses the highest-EV channel of the quarter |
| 5 | An Ahrefs plan with Keywords Explorer, *or* a Keyword Planner account | Volume figures stay estimates |

---

## 12. Honest summary in five lines

1. DR 0 against DR 34–77 incumbents means **no head term is winnable this quarter** — the
   plan wins the long tail and the LLD gap instead.
2. Realistic organic traffic on 1 Nov 2026: **~320 clicks/month** (range 150–700), and
   **~$26/month** in course revenue. SEO is the 12-month asset, not the 90-day one.
3. The 90-day wins that matter are **51 quality pages, 2 pillars, 9 referring domains,
   DR ~10, 45 queries in positions 5–20** — those are what produce the 2027 numbers.
4. **LLD is the wedge**: least contested SERP, you already own the course and the videos,
   and nobody on your site targets it.
5. **Publish the videos.** In this 90-day window YouTube and communities will out-earn
   Google, and they make Google work faster.
