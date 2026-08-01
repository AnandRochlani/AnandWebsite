# Full SEO Audit — anandrochlani.com

**Date:** 31 July 2026 · **Auditor pass:** technical + on-page + content + off-page + AI search
**Scope:** the live site, the build pipeline, and the newly added Coding Interview cluster.

Companion documents: [SEO_AUDIT_2026-07-31.md](SEO_AUDIT_2026-07-31.md) (the earlier
release-gate audit, still accurate), [SEO_STRATEGY.md](SEO_STRATEGY.md),
[UDEMY_PROMOTION_PLAYBOOK.md](UDEMY_PROMOTION_PLAYBOOK.md).

---

## 1. Executive summary

The technical foundation is genuinely good and is not where the remaining upside is.
`npm run seo:audit` against production returns **0 critical, 0 warnings, 40 passes across
33 crawled URLs**, and the build gate (`npm run build`) fails the deploy on any metadata,
schema, depth, link or indexability regression. Prerendering, canonicals, the 404 path,
robots and the sitemap are all correct.

The real constraints are, in order:

1. **No off-page authority.** Nothing on this site outranks an established competitor
   without links, and there is currently no earned-link programme running.
2. **No measurement loop.** Search Console automation exists (`seo-pipeline/gsc.mjs`) but
   the property is not connected, so the content queue is being prioritised on judgment
   rather than on impressions and average position.
3. **A second cluster just landed.** The Coding Interview cluster (2 published articles,
   2 staged, 2 course pages) starts from zero and needs its own internal-link scaffolding.

Everything else in this document is a finding with a specific fix. Fixes marked **✅ fixed
in this pass** were applied while auditing.

---

## 2. What changed in this audit pass

| Change | Why it mattered |
|---|---|
| ✅ Introduced `src/lib/contentTaxonomy.js` | Nine files hard-coded `category === 'System Design'`. Any second topic would have been silently excluded from the sitemap, the prerenderer, the blog index and the public API ordering, and served `noindex`. |
| ✅ Rewrote `public/llms.txt` | It described the site as *"web development, design, and data science"* — the abandoned positioning. Every AI assistant reading it got the wrong topic for the whole domain. |
| ✅ Per-course descriptions, FAQs and body copy in the prerenderer | All course pages shared one hard-coded System Design description and one FAQ set. With three courses that is duplicate content and duplicate `FAQPage` schema. |
| ✅ Fixed the live-API course merge | Live database records replaced bundled ones wholesale, so build-time SEO fields were dropped and the flagship course page fell back to the generic description. |
| ✅ Added `seoTitle` to courses | `"Crack the Amazon Coding Interview: 15 LeetCode Patterns Course \| AnandRochlani"` was being truncated mid-phrase to `"Crack the Amazon Coding Interview: 15… "`. |
| ✅ Broadened home / blog / courses / about titles and descriptions | They claimed a System-Design-only site. `About Anand Rochlani — System Design Educator` was also overflowing and truncating. |
| ✅ `Course` schema: `educationalLevel`, `teaches`, conditional `hasCourseInstance` | Unshipped courses must not advertise an instance a learner can join. |
| ✅ Cluster-aware diagram chrome + `--drafts` injection mode | Diagrams hard-coded the "SYSTEM DESIGN" eyebrow and the series in the footer attribution that travels with shared copies. |
| ✅ Per-series `order` uniqueness in the QA gate | `order` was globally unique, so a second series numbering from 1 would have failed the gate. |
| ✅ Public API now merges bundled content with the database | See D1 below — this was a live user-facing bug, not a cosmetic one. |

---

## 3. Technical SEO — status: strong

| Check | Result |
|---|---|
| Canonical host, HTTPS, HSTS | Pass. Apex only; `www` correctly absent everywhere. |
| Per-route crawlable HTML | Pass. 42 static files, 37 indexable pages, full article text inline. |
| Canonicals | Pass. Exactly one per indexable URL; numeric `/courses/<id>` canonicalises to the slug. |
| 404 handling | Pass. Real hard 404s, no soft 404s; app shell is `noindex` with no canonical. |
| Sitemap | Pass. 37 URLs, all apex, all 200, full coverage. |
| robots.txt | Pass. Content open, `/api/` disallowed, sitemap declared. |
| Structured data | Pass. WebSite, Organization, Person, BlogPosting, Course, FAQPage, BreadcrumbList, CollectionPage, DefinedTermSet. No double-emission (SEOHead defers to `id="ld-prerender-N"`). |
| Titles / descriptions | Pass. Unique across all 37 pages, enforced by the build gate. |
| Image alt text | Pass. Diagrams carry descriptive alt that can stand in for the image. |
| IndexNow | Configured, key deployed. |

### Open technical items

**T1 — `www` is not attached in Vercel.** Low severity but free to fix: DNS CNAMEs to apex
while Vercel refuses the certificate, so any inbound link someone types with `www` fails
TLS and the link is wasted. Add `www.anandrochlani.com` in Vercel as a redirect to apex.

**T2 — `blogPosts.js` is a 286 KB (90 KB gzipped) client chunk.** It bundles the entire
legacy blog corpus into JavaScript shipped to anyone who opens a blog route, purely as a
database-outage fallback. Since every blog page is now prerendered with its full text, the
fallback is redundant for crawlers and only affects real users on a cold cache. Consider
trimming it to metadata only, or dropping the bodies from the client bundle. This is an
INP/LCP item, not an indexation one.

**T3 — `cache-control: public, max-age=0, must-revalidate` on HTML.** Correct for
freshness, but every navigation is a revalidation round-trip. `s-maxage` with
`stale-while-revalidate` on the prerendered HTML would improve real-user TTFB without
delaying content updates.

---

## 4. On-page and content

### Inventory after this pass

| | System Design | Coding Interview |
|---|---:|---:|
| Published articles | 25 | 2 |
| Staged (batch 2) | 0 | 2 |
| Queued | 8 | 4 |
| Course pages | 1 (live on Udemy) | 2 (in production) |
| Hubs | case studies, glossary | — (the pillar article acts as the hub) |
| Article depth | 1,256–1,936 words | 1,433–1,556 words |
| Original diagrams | 25 generated | 4 generated + injected |

### Findings

**C1 — 25 System Design diagrams are generated but never injected.** `public/diagrams/`
holds 25 finished SVGs for the System Design articles that no page references. This is
the single largest ready-made win in the audit: Google Images is a real traffic source for
"consistent hashing diagram"-type queries, and diagrams measurably improve dwell time.
They cannot be injected from here because the live database write needs credentials.

```bash
ADMIN_USERNAME=... ADMIN_PASSWORD=... node seo-pipeline/diagrams/inject.mjs --yes
```

**C2 — The 8 off-topic template posts still exist in the database.** They are already out
of the index, out of the sitemap, and 404 at their routes, but the public API still returns
them. Finish the job (a backup is written first, and the script refuses to touch anything
in an indexable cluster):

```bash
ADMIN_USERNAME=... ADMIN_PASSWORD=... node seo-pipeline/cleanup-offtopic.mjs --yes
```

**C3 — The Coding Interview cluster has no hub page.** System Design has
`/system-design-case-studies` and `/system-design-glossary`. The new cluster relies on the
pillar article alone. Once there are 6+ articles, add `/coding-interview-patterns` as a
crawlable hub listing all 15 patterns — it is the page most likely to earn links, because
it is referenceable.

**C4 — Internal links into the new cluster are thin.** `npm run seo:links` proposes 21
contextual links that have never been applied. The two new articles are reachable from each
other and from the course pages, but no established System Design article links into them,
so they inherit almost no internal PageRank. Apply the proposals to drafts, then push the
live-post rewrites:

```bash
node seo-pipeline/internal-links.mjs --apply --yes
```

**D1 — ✅ Deployed content was invisible to the app (fixed).** The publishing mechanism has
two halves that had drifted apart. Adding a draft JSON and deploying publishes a
*prerendered page*; writing it into Neon requires `publish.mjs` with admin credentials.
The public API only fell back to bundled content when the database **threw**, so after this
deploy the two new articles and two new course pages were live, crawlable and in the
sitemap — but absent from `/blog`, absent from `/courses`, absent from their own series
sidebar, and a hard 404 on in-app navigation, because the API did not know they existed.

Both public endpoints now merge the bundled catalog with the database rows, database
winning field by field. This is the same `mergeByKey` behaviour `prerender.mjs` and
`generate-sitemap.mjs` already used, so the API, the static build and the sitemap finally
agree on one inventory. The bundled merge is deliberately scoped to indexable clusters, so
deleting the eight off-topic posts from the database still removes them for good rather
than resurrecting them from the bundle on the next request.

Running `publish.mjs` is still worthwhile — it puts the articles in the admin UI and gives
them real database ids — but it is no longer load-bearing for the site to work.

**C5 — Two staged articles depend on a follow-up.** `seo-pipeline/articles/staged/` holds
the sliding window and two pointers articles. Article 2's "Next Steps" was deliberately
rewritten to avoid linking to them, because those links would 404 until batch 2 ships. When
you move batch 2 into `seo-pipeline/articles/`, restore the cross-links.

---

## 5. E-E-A-T and trust

Strong for a personal site: a real named author, a verifiable employer, an About page with
`Person` schema, and consistent authorship across all articles.

**E1 — No `author` link from articles to the About page.** `BlogPosting` names the author
but the rendered byline is plain text. Linking every byline to `/about` and adding
`sameAs` (LinkedIn, GitHub, Udemy instructor profile, YouTube) to the `Person` node is the
cheapest entity-consolidation win available.

**E2 — No "last updated" date on articles.** Freshness is a genuine ranking input for
interview-prep queries, which are re-searched every hiring season. `dateModified` exists in
schema; surface it visibly as "Updated 31 July 2026" and keep it honest.

**E3 — The two in-production course pages must never imply purchase.** Currently correct —
no rating, no enrolment count, no `Offer`, no `hasCourseInstance`, an explicit "IN
PRODUCTION" badge and a "Launching soon" price. Preserve that when they ship: replace the
whole block at once, do not leave a stale "Launching soon" beside a live Udemy link.

---

## 6. Off-page — the actual bottleneck

There is no link programme running. `seo-pipeline/backlinks/` contains the prospecting and
monitoring tooling; it has no campaign in it.

For a domain at this authority level, on-page work has diminishing returns beyond roughly
30 solid pages. The head terms — "system design interview", "leetcode patterns" — are won
with links, not with a 26th article. The concrete plan lives in
[UDEMY_PROMOTION_PLAYBOOK.md](UDEMY_PROMOTION_PLAYBOOK.md); the short version:

- The most linkable assets already exist: the estimation guide, the interview framework,
  the roadmap SVG, the checklist, and now the 15-patterns pillar.
- Do not buy links, run automated blog comments, or use sitewide exchanges. SpamBrain
  neutralises them and a manual action on the funnel domain would be unrecoverable.

---

## 7. AI search / GEO

This is the fastest-moving surface and the one with the largest gap-to-effort ratio.

**A1 — ✅ `llms.txt` was actively harmful and is now fixed.** It is worth re-checking every
time positioning changes.

**A2 — Answer-shaped content is already right.** Every article has a "How to talk about
this in an interview" section containing a quotable 30-second answer, plus a Key Takeaways
list. That is close to the ideal extractable-passage format. Keep it.

**A3 — Verify AI crawler access.** `robots.txt` allows all user agents, so GPTBot,
ClaudeBot, PerplexityBot and Google-Extended can all read the site. That is the correct
setting for a funnel domain, but it is a deliberate choice worth re-confirming — blocking
them removes the site from AI answers entirely.

**A4 — Diagrams carry attribution.** Each SVG has a footer band reading
`anandrochlani.com · <series>`, so a hot-linked or screenshotted copy still names the
source. This is genuinely good practice for AI-summarised content; keep it on every new
diagram.

---

## 8. Measurement — the missing loop

**M1 — Search Console is not connected.** This is the highest-priority non-content item.
Until it is, the content queue is guesswork. Setup is documented in
`seo-pipeline/GSC_SETUP.md`; it needs a GCP service account added to the property.

```bash
node seo-pipeline/gsc.mjs submit     # after each publishing batch
node seo-pipeline/gsc.mjs inspect    # weekly
```

**M2 — No analytics.** Deliberate, pending consent decisions. Without it you cannot see
which articles actually send clicks to Udemy, which is the only conversion that matters.
A privacy-preserving option (Plausible, Umami, or Vercel Analytics) avoids the consent
banner entirely.

**M3 — Udemy referral attribution is single-channel.** Every CTA uses the same referral
code, so Udemy cannot tell you whether a sale came from the blog, YouTube or LinkedIn. Add
a UTM query string per surface; the referral code still tracks the commission.

---

## 9. Prioritised action list

Ordered by expected return per hour of effort.

| # | Action | Needs |
|---|---|---|
| 1 | Connect Search Console, submit the sitemap | Google account |
| 2 | Inject the 25 existing System Design diagrams | Admin credentials |
| 3 | Deploy this branch (2 new articles, 2 course pages, taxonomy, llms.txt) | Push |
| 4 | Apply the 21 proposed internal links | Admin credentials |
| 5 | Delete the 8 off-topic posts from the database | Admin credentials |
| 6 | Ship batch 2 (staged articles) ~4 days later, restore cross-links | Push |
| 7 | Start the link programme — 3 outreach targets per week | Time |
| 8 | Add `sameAs` to `Person`, link bylines to `/about` | Code |
| 9 | Surface "Updated" dates on articles | Code |
| 10 | Attach `www` in Vercel as a redirect | Vercel |
| 11 | Trim the `blogPosts.js` client chunk | Code |

---

## 10. Verification for this pass

- `npm run build` — 42 static pages, **37 indexable, 0 errors, 0 content warnings**
- `npm run lint` — pass
- `npm run seo:qa` — 18 drafts pass (16 System Design + 2 Coding Interview)
- `node seo-pipeline/qa.mjs seo-pipeline/articles/staged/*.json` — 2 staged drafts pass
- `npm run seo:audit` (live) — **0 critical, 0 warnings, 40 passes, 33 URLs**
- `npm run seo:links` — 0 broken internal links; 16 HTML fixtures pass
- `npm run seo:diagrams` — 29 diagrams, deterministic output
- `npm run seo:sitemap` — 37 URLs

- `node tools/test-validators.mjs` — 34/34 pass
- API merge functions — asserted for: bundled-only course present, database wins on shared
  fields, bundled-only fields preserved, empty/undefined database, no duplicate slugs,
  cluster ordering, and no off-topic resurrection after cleanup

The first deploy of this work is already live (`/blog/leetcode-patterns-coding-interview-guide`,
`/blog/google-coding-interview-questions-preparation-guide`,
`/courses/amazon-coding-interview-patterns`, `/courses/google-coding-interview-50-problems`
all return 200; the two staged articles correctly return 404). The API merge fix is not yet
deployed. After deploying it, re-run `npm run seo:audit` — the remaining
`SITEMAP_STALE_URL` warning resolves once the API reports the four new URLs — then
`npm run seo:indexnow -- --yes`.
