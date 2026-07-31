# Google Search Console — complete setup walkthrough

Written for someone who has **never opened Search Console before**. Follow it top to bottom
once; after that you only ever do Step 4 (resubmit sitemap) and Step 5 (request indexing).

**Site:** `https://anandrochlani.com` (the APEX domain).

> ⚠️ **Never use `https://www.anandrochlani.com` anywhere in this process.** That hostname has a
> broken TLS certificate. Any crawler or tool that follows it gets a certificate error, which
> looks to Google like an unreachable site. Every URL you type into GSC must be the apex form.

Google is **not** part of IndexNow. `indexnow.mjs` covers Bing, Yandex, Naver and Seznam;
Search Console is the *only* way to push URLs at Google. That is why this document exists.

---

## 0. What Search Console actually is

A free Google product that shows you:

- which of your pages Google has crawled and indexed (and which it refused to),
- what search queries showed your pages, how many clicks/impressions each got,
- technical problems: mobile usability, Core Web Vitals, structured-data errors.

It does **not** improve rankings by itself. It is a diagnostic panel plus two levers
(submit a sitemap, request indexing of one URL).

Sign in at <https://search.google.com/search-console> with the Google account you want to own
the data long-term (use `bharateduhub@gmail.com`, not a throwaway).

---

## 1. Choose the property type — pick **Domain**

On first sign-in Google offers two boxes:

| Property type | Covers | Verification |
|---|---|---|
| **Domain** ← *use this* | `anandrochlani.com`, `www.anandrochlani.com`, `http://`, `https://`, every subdomain | DNS TXT record only |
| URL prefix | Exactly one scheme+host, e.g. `https://anandrochlani.com/` | HTML file, meta tag, GA, GTM, or DNS |

Pick **Domain** and type `anandrochlani.com` (no `https://`, no `www.`, no trailing slash).

**Why Domain:** one property covers apex *and* www *and* http *and* future subdomains, so you
never end up with four half-empty properties and split reporting. It also survives the eventual
www-certificate fix without any re-verification.

---

## 2. Verify ownership with a DNS TXT record

Google shows a string like:

```
google-site-verification=AbCdEf1234567890abcdefghijklmnopqrstuvwxyz
```

Copy it, then add it at whoever hosts the **DNS** for `anandrochlani.com` (your domain
registrar, or Vercel if the nameservers point there):

| Field | Value |
|---|---|
| Type | `TXT` |
| Name / Host | `@` (some registrars want the bare domain, or leave blank — **not** `www`) |
| Value | `google-site-verification=AbCdEf…` (paste exactly, including the `google-site-verification=` prefix) |
| TTL | default / 3600 |

Save, then click **Verify** back in GSC.

- Propagation is usually 1–15 minutes, occasionally a few hours. If verification fails, wait and
  press Verify again — the button is re-usable, nothing is lost.
- Check the record from your terminal: `dig +short TXT anandrochlani.com` (or `nslookup -type=TXT anandrochlani.com`).
  The string must appear in the output before Google can see it.
- **Do not delete the TXT record afterwards.** Google re-checks it periodically; removing it
  un-verifies the property and you lose access to the data.

Repeat the same steps in **Bing Webmaster Tools** (<https://www.bing.com/webmasters>) — it can
import everything from GSC in one click, and it is where IndexNow submissions show up.

---

## 3. First-day housekeeping

Once verified, in the left sidebar:

- **Settings → Users and permissions** — confirm you are Owner.
- **Settings → Ownership verification** — confirm the DNS method shows "Verified".
- **Indexing → Sitemaps** — do Step 4 now.

New properties are empty for **2–3 days**. That is normal; data is not backfilled from before
verification.

---

## 4. Submit the sitemap

1. Left sidebar → **Indexing → Sitemaps**.
2. In "Add a new sitemap", the domain prefix is pre-filled. Type just:
   ```
   sitemap.xml
   ```
   so the full URL reads `https://anandrochlani.com/sitemap.xml`.
3. Click **Submit**.

Expected result within a few minutes to a day:

| Status | Meaning |
|---|---|
| **Success** | Fetched and parsed. "Discovered URLs" shows the count. |
| **Couldn't fetch** | Google got a non-200 / timeout. Run `node seo-pipeline/indexing/ping-sitemap.mjs` — it tells you exactly what the server returned. |
| **Has errors** | Parsed but some entries are invalid (bad `<lastmod>`, wrong host, non-canonical URLs). |

You only need to submit **once**. Google re-fetches the sitemap on its own schedule. After a big
content drop you can click the sitemap row → the ⋮ menu → **Refresh**, but re-submitting the same
URL repeatedly achieves nothing.

Note: "Discovered URLs: 22" does **not** mean 22 pages are indexed. It means the file listed 22
URLs. Indexing is Step 6.

---

## 5. URL Inspection — request indexing for one page

Use this for a brand-new article, or a page you just materially rewrote.

1. Click the **search bar at the very top** of GSC ("Inspect any URL in…").
2. Paste the **full apex URL**, e.g.
   `https://anandrochlani.com/blog/design-facebook-news-feed-system-design-interview-guide`
3. Press Enter. Google checks its index (a few seconds) and reports one of:
   - **URL is on Google** — indexed. Nothing to do.
   - **URL is not on Google** — not indexed yet, with a reason underneath.
   - **URL is on Google, but has issues** — indexed, with a warning worth reading.
4. Click **TEST LIVE URL** (top right). This fetches the page *right now* with Googlebot.
   Then open **VIEW TESTED PAGE → Screenshot / HTML**.
   > This site is a React SPA, so this test matters more than usual: confirm the screenshot shows
   > your real article text and the HTML tab contains the heading and body copy. If you see an
   > empty shell, Google is not seeing your content and no amount of submitting will help.
5. Click **REQUEST INDEXING**. It queues a crawl (usually minutes to a couple of days).

Limits and etiquette:

- Roughly **10–12 requests per property per day**. Requesting the same URL repeatedly does not
  move it up the queue and can get the quota throttled.
- Requesting indexing is **not** a promise of indexing. Google decides based on quality/value.
- For bulk changes, rely on the sitemap; use URL Inspection only for pages you care about most.

---

## 6. Reading the reports

### Performance (`Performance → Search results`)

Four metrics across the top — click each to toggle it onto the graph:

| Metric | Definition | How to read it |
|---|---|---|
| **Clicks** | Someone clicked through to your site | The only one that is real traffic |
| **Impressions** | Your page appeared in results (even at position 47) | Rising impressions with flat clicks = you rank, but the title/description isn't compelling |
| **Average CTR** | Clicks ÷ Impressions | Below ~2% at position <10 means rewrite the title/meta description |
| **Average position** | Mean ranking across impressions | Noisy; look at the trend over weeks, never day to day |

Tabs below the graph: **Queries** (what people typed), **Pages** (which URLs), **Countries**,
**Devices**, **Search appearance**, **Dates**.

Highest-value habit: sort **Queries** by impressions, find queries where you rank 8–20, and
strengthen that specific article for that specific phrasing. Those are the cheapest wins.

Data lags 1–2 days and drops queries with tiny volume, so totals never match analytics exactly.

### Pages (`Indexing → Pages`)

Two buckets: **Indexed** and **Not indexed**, with a reason breakdown underneath. This is the
report you check after publishing. The two reasons you *will* hit are explained in §7.

### Core Web Vitals (`Experience → Core Web Vitals`)

Real Chrome-user field data, split Mobile / Desktop, grouped into Good / Needs improvement / Poor:

| Metric | What it measures | "Good" |
|---|---|---|
| **LCP** — Largest Contentful Paint | When the biggest above-the-fold element finishes rendering | ≤ 2.5 s |
| **INP** — Interaction to Next Paint | Responsiveness to taps/clicks (replaced FID in March 2024) | ≤ 200 ms |
| **CLS** — Cumulative Layout Shift | How much the layout jumps while loading | ≤ 0.1 |

Notes for this site:

- It needs ~28 days of real traffic before it shows anything. "No data" on a low-traffic site is
  expected, not a bug.
- It is a **minor** ranking factor. Fix genuinely Poor URLs; do not chase a perfect score.
- For a React SPA, LCP is usually the JS bundle and hero image; CLS is usually images without
  explicit width/height and late-loading fonts.
- For instant per-page feedback instead of 28-day field data, use PageSpeed Insights:
  <https://pagespeed.web.dev/> (lab data, available immediately).

Also worth a glance: **Experience → HTTPS**, **Indexing → Sitemaps**, and **Shopping/Enhancements**
sections if you ever add structured data (Article/FAQ schema).

---

## 7. The two statuses that will confuse you

Both live under **Indexing → Pages → Why pages aren't indexed**. They sound similar and mean
completely different things.

### "Discovered – currently not indexed"

**What it means:** Google knows the URL exists (from your sitemap or an internal link) but has
**not crawled it yet**. No content has been fetched. It is sitting in the crawl queue.

**Why it happens:**
- Crawl budget: Google throttles how much it crawls a new/low-authority domain.
- The server looked slow when Google tried, so it deferred.
- Google's quality prediction (based on the rest of the site) says the page probably isn't worth
  a fetch yet.

**What to do:**
1. Wait. On a young site this genuinely resolves in days to weeks.
2. **Add internal links** to the page from pages Google already crawls often (your `/blog` index,
   the homepage, and 2–3 related articles). This is the single most effective fix — orphaned pages
   linked only from a sitemap sit in this state the longest.
3. Make sure the page is in the sitemap with an accurate `<lastmod>`.
4. Use URL Inspection → Request Indexing for your best 5–10 pages (quota is ~10/day).
5. Keep the site fast — a slow server directly reduces crawl rate.
6. Do **not** delete and re-publish the page, and do not spam re-requests.

### "Crawled – currently not indexed"

**What it means:** Google **did fetch the page**, looked at it, and chose not to put it in the
index. This is a quality/value judgement, not a technical error.

**Why it happens:**
- Thin content, or content that duplicates what's already on the web (or on your own site).
- Near-duplicate of another page of yours — Google keeps one and drops the rest.
- The SPA rendered empty/near-empty for Googlebot, so it saw a boilerplate shell.
- The page adds nothing a dozen existing pages don't already say.

**What to do:**
1. **Check what Google actually saw first**: URL Inspection → TEST LIVE URL → VIEW TESTED PAGE →
   HTML tab. If your article body is missing there, this is a rendering problem, not a quality
   problem, and no rewriting will fix it.
2. Otherwise: make the page substantially better — more depth, original diagrams/examples/code,
   a clear unique angle, proper headings. Then update `<lastmod>`, redeploy, and Request Indexing
   once.
3. Consolidate near-duplicates: merge thin overlapping posts into one strong page and 301 the old
   URLs (this repo already does that pattern in `vercel.json` `redirects`).
4. Build a few real internal/external links to it, so Google has a reason to reconsider.
5. Accept that some pages will never be indexed. That is normal and not a penalty.

### Quick reference for the rest

| Status | Meaning | Action |
|---|---|---|
| **Excluded by 'noindex' tag** | Page tells Google not to index it | Remove the meta tag if unintentional |
| **Duplicate without user-selected canonical** | Google picked a different URL as canonical | Set an explicit `<link rel="canonical">` |
| **Alternate page with proper canonical tag** | Working as intended | None |
| **Page with redirect** | URL 301/302s elsewhere | Remove redirecting URLs from the sitemap |
| **Not found (404)** | Dead URL still listed/linked | Remove from sitemap, or restore the page |
| **Soft 404** | Returns 200 but looks empty | Common SPA trap — return real content or a real 404 |
| **Crawl anomaly / Server error (5xx)** | Fetch failed | Check the deploy and function logs |
| **Blocked by robots.txt** | Disallowed | Only `/admin/` should be blocked here |

---

## 8. Ongoing routine

| When | Do |
|---|---|
| After publishing an article | Regenerate + deploy the sitemap → `ping-sitemap.mjs` → `indexnow.mjs --new --yes` → GSC URL Inspection → Request Indexing |
| Weekly | **Indexing → Pages**: did anything new land in "Not indexed"? |
| Weekly | **Performance → Queries**: find position 8–20 queries and improve those pages |
| Monthly | **Core Web Vitals** and **Sitemaps** status |
| Never | Re-submitting the same sitemap daily, or re-requesting indexing for the same URL repeatedly |

---

## 9. If something is wrong

| Symptom | Check |
|---|---|
| Sitemap "Couldn't fetch" | `node seo-pipeline/indexing/ping-sitemap.mjs` |
| Verification lost | The DNS TXT record was deleted — re-add it |
| Zero data after a week | Wrong property (www vs apex), or genuinely zero impressions |
| Page indexed under `www.` | Broken-cert host got indexed — fix canonicals to apex and 301 www → apex |
| Live test shows empty HTML | SPA rendering problem — the highest-priority SEO bug on this site |
