# SEO & Backlinks — a plain-English guide for anandrochlani.com

Written for someone who has never done SEO. No jargon without an explanation.
Everything here is specific to this site: a React blog publishing the **System Design
Tutorial** series, funnelling readers to the Udemy course *System Design Fundamentals
for Interviews*.

---

## 1. The one-paragraph version

Google ranks a page by asking two questions: **"is this page about the thing the
person searched for?"** and **"is this page trustworthy enough to show first?"**
Your content answers the first question. Backlinks — other websites linking to
yours — are the main way Google answers the second. But none of it matters if Google
can't *read* your pages in the first place. That last part is where this site was
broken, and it's why the technical fixes came before any link building.

---

## 2. What a backlink actually is

A backlink is just a link on **someone else's** website pointing to **yours**:

```html
<!-- on someone-elses-blog.com -->
<a href="https://anandrochlani.com/blog/consistent-hashing-explained">
  a good explanation of consistent hashing
</a>
```

That's it. There's no registration, no submission, no central database. If a page
links to you and Google crawls that page, Google records the link.

### Why Google cares

Google's original insight (PageRank, 1998) was that a link is a **vote**. If lots of
respected sites link to a page, it's probably worth reading. Crucially, votes aren't
equal — a link from a site that is itself heavily linked-to counts far more than one
from a site nobody links to. Authority flows through the graph.

Three things determine what a link is worth:

| Factor | What it means | Example for your site |
|---|---|---|
| **Authority** of the linking site | How trusted that site already is | A link from a university CS course page ≫ a link from a brand-new blog |
| **Relevance** | Is the linking page about your topic? | A distributed-systems newsletter ≫ a gardening blog |
| **Anchor text** | The clickable words in the link | "consistent hashing guide" tells Google the topic; "click here" tells it nothing |

### `dofollow` vs `nofollow`

Some links carry a `rel="nofollow"` (or `ugc`, or `sponsored`) attribute:

```html
<a href="https://anandrochlani.com/..." rel="nofollow">link</a>
```

This tells Google "don't pass authority through this link." Most links you can place
*yourself* — forum posts, blog comments, social profiles — are automatically
`nofollow`, which is precisely why self-placed links don't move rankings. They can
still send you real readers, which has its own value. `monitor.mjs` in
`seo-pipeline/backlinks/` watches for links that silently flip to `nofollow` later.

---

## 3. Why automated backlink software doesn't work

You asked for something like Money Robot. Here's the honest reasoning for why this
pipeline doesn't do that.

Those tools mass-create accounts on Web 2.0 sites, wikis, forums and directories,
solve the CAPTCHAs, and post spun content containing your link. The pitch is
thousands of backlinks for a flat fee.

The problem is that this stopped working. In **December 2022** Google shipped a link
spam update built on **SpamBrain**, which detects and **neutralises** links of this
kind — they're ignored rather than counted. So the normal outcome is that you pay and
nothing happens. The bad outcome is a **manual action**: a human reviewer at Google
penalises the domain, and your existing rankings disappear.

That trade is bad for you specifically. `anandrochlani.com` is your funnel to a paid
course and eventually to BharatEduHub. It is not a disposable domain — the downside
is losing the asset, and the upside was already priced out of existence.

Two practical tells that a "link package" is worthless: the links appear in days
rather than months, and you can buy them at a fixed price per thousand. Real editorial
links are slow and individually negotiated, because a human decided to add each one.

---

## 4. What actually earns links for a site like yours

Ranked by what works best for technical-education content:

1. **Be the best explanation of a specific thing.** Most "consistent hashing"
   articles are the same Wikipedia summary. One with a worked example, real numbers,
   and a clear diagram gets cited by people writing their own posts and by course
   syllabi. This is the highest-return activity available to you.
2. **Original diagrams.** Engineers embed diagrams and credit the source. A clean,
   reusable architecture diagram is one of the most linkable artifacts in this niche.
3. **Free tools.** A capacity-estimation calculator, a latency-numbers cheat sheet, a
   back-of-the-envelope sizing tool. Tools accumulate links for years.
4. **Original data.** "I analysed 200 system design interview questions from
   Glassdoor — here's what actually gets asked." Nobody else has your numbers, so
   anyone citing the topic has to cite you.
5. **Guest posts** on engineering blogs that accept contributors.
6. **Resource pages and awesome-lists.** Curated GitHub lists and university course
   pages link to good free material. A genuinely useful entry is welcome.
7. **Answering questions properly** on Stack Exchange, Reddit and similar — where a
   link is a *citation supporting a real answer*, not a drive-by drop. Contribute
   first; these communities punish self-promotion, and the links are usually
   `nofollow` anyway, so treat them as traffic, not authority.

The tracker for all of this is `seo-pipeline/backlinks/`. It manages **your** outreach
— it never places a link itself, and it never sends an email by itself.

---

## 5. What was actually broken here (and why it mattered more than links)

An audit of the live site found two problems that outweighed any link building.

### 5.1 Every page pointed at a dead hostname

`www.anandrochlani.com` is not attached in Vercel and **fails its TLS certificate
check** — it serves nothing. The apex domain, `anandrochlani.com`, works fine.

But the sitemap, the `robots.txt` sitemap declaration, and every page's canonical tag
all pointed at the `www` version.

A **canonical tag** tells Google "this is the real address of this page, index it
under this URL." Every page on the site was naming an address that doesn't load. Every
URL in the sitemap was unreachable. That alone is enough to stop a site from ranking,
and no quantity of backlinks would have fixed it.

**Fixed:** everything now points at the apex domain.

### 5.2 Google was served a blank page

The site is a client-rendered React SPA. Every URL returned the *same* HTML file, with
the same generic title, the same description, no canonical tag, and none of the
article text — all of that only appeared after JavaScript ran in the browser.

The audit found all 22 pages sharing one title and one description, and 12 pages whose
served HTML contained none of their own content.

Google *can* execute JavaScript, but it's slower, less reliable, and every other
crawler — Bing, social preview bots, AI crawlers, and the bots that generate link
previews — mostly doesn't. To much of the web your site looked like one page repeated
22 times.

**Fixed:** `seo-pipeline/prerender.mjs` now runs after every build and writes a real
HTML file per URL, each with its own title, description, canonical, Open Graph tags,
structured data, and the full article text in the source. React still takes over on
load, so what visitors see is unchanged.

### 5.3 Missing pages returned "200 OK"

Any unknown URL returned HTTP 200 and an indexable page instead of a 404. Google calls
this a **soft 404** and it wastes crawl budget on pages that don't exist.

**Fixed:** unknown routes now render a real 404 page marked `noindex`.

---

## 6. The four layers, in priority order

Work top-down. A lower layer can't compensate for a broken one above it.

```
   ┌──────────────────────────────────────────────┐
 1 │ TECHNICAL — can Google read the page at all? │  ← was broken; now fixed
 2 │ CONTENT   — does the page answer the query?  │  ← your main ongoing work
 3 │ INTERNAL  — do your own pages support each   │  ← automated
   │             other?                            │
 4 │ OFF-PAGE  — do other sites vouch for you?    │  ← slow, manual, compounding
   └──────────────────────────────────────────────┘
```

**Layer 1 — Technical.** Covered above, plus the sitemap (a list of your URLs for
Google), `robots.txt` (crawl rules), page speed, and structured data (the JSON-LD that
makes rich results possible). Verify with `npm run seo:audit`.

**Layer 2 — Content.** One page targeting one primary keyword, answering the question
better than what currently ranks. Your `content-plan.json` already maps topics to
keywords. Two open items: tutorials 3–8 are only 200–400 words and need expanding, and
eight off-topic template posts (React hooks, CSS grid, D3…) dilute the site's
system-design focus and should go.

**Layer 3 — Internal links.** Links between your own pages. Free, fully under your
control, and genuinely effective — they spread authority from strong pages to weak
ones and show Google the topic cluster. `npm run seo:links` finds the opportunities.

**Layer 4 — Off-page.** Backlinks. Slowest, hardest, but compounds. Only worth serious
effort once layers 1–3 are solid — which, as of now, they are.

---

## 7. Your routine

**After publishing an article**

```bash
npm run seo:qa          # format/link/CTA gate on the drafts
npm run seo:sitemap     # regenerate public/sitemap.xml
npm run seo:links       # find internal-link opportunities
git add -A && git commit -m "content: publish article" && git push   # Vercel redeploys + prerenders
npm run seo:audit       # confirm the live result
npm run seo:indexnow    # tell Bing/Yandex (dry run; add --yes to send)
```

Then request indexing for the new URL in Google Search Console.

**Weekly:** `node seo-pipeline/backlinks/outreach.mjs due` and send what's due.

**Monthly:** `npm run seo:audit` and `npm run seo:backlinks`, and review Search Console
for queries where you rank 5–15 — those are the cheapest wins, because a page ranking
11th usually needs a better title and a few internal links, not a new article.

---

## 8. Expectations

SEO is slow, and anyone promising otherwise is selling something.

- **Weeks 1–2:** Google recrawls and picks up the technical fixes. Because this site
  was being told its pages lived at an unreachable hostname, this step alone should
  produce a visible change.
- **Months 1–3:** new articles start ranking for long-tail phrases — specific,
  lower-competition queries like *"consistent hashing virtual nodes explained"*.
- **Months 3–6:** the earlier articles mature, internal links compound, and the first
  earned backlinks land.
- **Months 6–12:** competitive head terms like *"system design interview"* become
  realistic — that's where the large established sites are, and it takes both content
  depth and real authority.

The single best predictor of the outcome is publishing consistently for a year. That
is genuinely most of it.

---

## 9. Glossary

| Term | Meaning |
|---|---|
| **SERP** | Search engine results page |
| **Canonical** | The tag naming a page's official URL, preventing duplicate-content splits |
| **Crawl budget** | How much attention Google spends crawling your site |
| **Soft 404** | A missing page that wrongly returns "200 OK" |
| **Anchor text** | The clickable words in a link |
| **`nofollow`** | Link attribute meaning "pass no authority" |
| **Structured data / JSON-LD** | Machine-readable page description enabling rich results |
| **Long-tail keyword** | A longer, more specific, lower-competition search phrase |
| **DR / DA** | Third-party 0–100 authority scores; useful for comparison, not Google metrics |
| **SSR / prerendering** | Producing real HTML on the server instead of only in the browser |
| **IndexNow** | Open protocol for telling Bing/Yandex a URL changed |
