# seo-pipeline/indexing — search-engine indexing submission

Tells search engines that pages on `https://anandrochlani.com` are new or changed, so they get
crawled in hours instead of weeks.

Node 18+ ESM, **zero npm dependencies** (global `fetch`, `node:fs`, `node:crypto`, `node:path`).
Nothing here is part of the Vite build.

| File | What it is |
|---|---|
| `indexnow.mjs` | Submits URLs to IndexNow (Bing / Yandex / Naver / Seznam). Dry-run by default. |
| `ping-sitemap.mjs` | Validates the live sitemap + robots.txt, then routes notification through IndexNow. |
| `lib.mjs` | Shared helpers (arg parsing, sitemap parsing, URL canonicalisation). Not run directly. |
| `gsc-setup.md` | Google Search Console walkthrough — Google is **not** an IndexNow participant. |
| `indexnow-key.json` | Generated on first run. The persistent API key. **Commit it.** |
| `submitted.json` | Generated on first real submit. History, so re-runs don't spam. **Commit it.** |
| `../../public/<key>.txt` | Generated on first run. Key verification file. **Commit + deploy it.** |

---

## Two engines, two mechanisms

| | Google | Bing / Yandex / Naver / Seznam |
|---|---|---|
| Push protocol | none (IndexNow unsupported) | **IndexNow** → `indexnow.mjs` |
| Sitemap discovery | `robots.txt` + Search Console | `robots.txt` + IndexNow + Webmaster Tools |
| Per-URL request | Search Console → URL Inspection → Request Indexing (manual, ~10/day) | covered by IndexNow |

The old `https://www.google.com/ping?sitemap=…` and `https://www.bing.com/ping?sitemap=…`
endpoints are **retired** (Google since June 2023). `ping-sitemap.mjs` deliberately does not call
them — it lists them as SKIPPED/DEPRECATED so nobody re-adds them later.

---

## Canonical host

Everything is forced to the **apex** `https://anandrochlani.com`.

`https://www.anandrochlani.com` has a **broken TLS certificate** — never submit it. IndexNow also
rejects (HTTP 422) any URL whose host differs from the `host` field, so mixing the two silently
kills a whole batch. `lib.mjs → toCanonicalUrl()` rewrites `www.` to apex and drops off-site URLs.

Override for testing only: `SITE_URL=https://staging.example.com node …`

---

## First-time setup (do this once)

```bash
# 1. Generates the key, writes public/<key>.txt, and shows what WOULD be submitted.
node seo-pipeline/indexing/indexnow.mjs --all

# 2. Commit the three generated files and deploy — the key file MUST be live,
#    or the engines answer 403 (key invalid).
git add seo-pipeline/indexing/indexnow-key.json public/*.txt
git commit -m "chore(seo): add IndexNow key"
git push          # Vercel deploys

# 3. Confirm the key file is really served as plain text (not the SPA shell):
curl https://anandrochlani.com/$(node -p "require('./seo-pipeline/indexing/indexnow-key.json').key").txt

# 4. Now a real submission is possible.
node seo-pipeline/indexing/indexnow.mjs --all --yes
```

`indexnow.mjs` runs a **key preflight** before every real submit and refuses to POST if the key
file isn't live and byte-identical. That is the #1 cause of 403s on Vercel: the SPA catch-all
rewrite returning `index.html` for a missing `.txt`.

Also do the one-time Google side: **[`gsc-setup.md`](./gsc-setup.md)**.

---

## Routine after publishing an article

```bash
# 1. regenerate the sitemap from live content, then commit + push (Vercel deploys)
node seo-pipeline/generate-sitemap.mjs

# 2. sanity-check the DEPLOYED sitemap and robots.txt
node seo-pipeline/indexing/ping-sitemap.mjs

# 3. see what would be submitted (dry run — always do this first)
node seo-pipeline/indexing/indexnow.mjs --new

# 4. submit for real
node seo-pipeline/indexing/indexnow.mjs --new --yes

# 5. commit the updated history so the next run doesn't resubmit the same URLs
git add seo-pipeline/indexing/submitted.json && git commit -m "chore(seo): indexnow submission log"
```

Then, for Google: Search Console → **URL Inspection** → paste the new URL → **Request Indexing**.

---

## `indexnow.mjs`

```
node seo-pipeline/indexing/indexnow.mjs <mode> [options]
```

**Modes** (exactly one; `--new` is the default)

| Mode | Effect |
|---|---|
| `--new` | URLs whose `lastmod`/post date is within `--days` (default **7**) |
| `--all` | every canonical URL in the sitemap + every blog post from the API |
| `--urls <a,b>` | explicit list; accepts full URLs or site-relative paths (`/blog/my-post`) |

**Options**

| Flag | Effect |
|---|---|
| `--dry-run` | print the exact payload and stop — **this is the default** |
| `--yes` | actually POST |
| `--days <n>` | freshness window for `--new` |
| `--force` | resubmit URLs the history says are unchanged |
| `--skip-key-check` | skip the key-file preflight (e.g. a deploy is still in flight) |
| `--source sitemap\|api\|both` | where URLs come from (default `both`) |
| `--sitemap <url>` / `--endpoint <url>` | overrides for testing |
| `--json` | machine-readable summary on stdout |
| `--help` | usage |

**Examples**

```bash
node seo-pipeline/indexing/indexnow.mjs --new                    # dry run, last 7 days
node seo-pipeline/indexing/indexnow.mjs --new --days 30 --yes    # submit last 30 days
node seo-pipeline/indexing/indexnow.mjs --all --yes              # submit everything
node seo-pipeline/indexing/indexnow.mjs --urls /blog/a,/blog/b --yes
node seo-pipeline/indexing/indexnow.mjs --all --force --yes      # ignore history
```

### How it decides what to send

1. **Collect** — sitemap `<loc>`/`<lastmod>` plus `/api/public/blog-posts` (which also gives a
   content hash of title+description+body).
2. **Canonicalise** — force apex + https, strip fragments and trailing slashes, drop off-host URLs.
3. **Filter by mode** — `--new` keeps entries inside the freshness window.
4. **Filter by history** — `submitted.json` stores a per-URL signature of
   `lastmod + contentHash`. Same signature ⇒ skipped, because resubmitting unchanged URLs is what
   gets you rate-limited (429). `--force` overrides.
5. **Batch** — max **10,000** URLs per request (protocol limit).
6. **Submit** — `POST https://api.indexnow.org/indexnow`, body
   `{host, key, keyLocation, urlList}`. The api.indexnow.org endpoint fans the submission out to
   all participating engines, so there is no need to call bing/yandex endpoints separately.
7. **Record** — history is written **only** for batches the engines accepted (200/202), so a
   failed run retries cleanly.

### Response codes

| Code | Meaning | What to do |
|---|---|---|
| **200** | URLs accepted | Nothing. Crawling happens on their schedule; acceptance ≠ indexing. |
| **202** | Accepted, key validation pending | The key file hasn't been fetched yet. Ensure `public/<key>.txt` is deployed; re-run later and it becomes 200. |
| **400** | Bad request | Malformed JSON or a malformed URL in `urlList`. |
| **403** | Key not valid | `keyLocation` didn't return exactly the key — usually the SPA rewrite serving HTML, or the key file not deployed. |
| **422** | URLs don't belong to the host | A URL's host ≠ `host` (classic `www.` vs apex mix), or the key doesn't match the schema. |
| **429** | Too many requests | Rate-limited. Stop, submit only changed URLs, use `--new` not `--all --force`. |

The script prints all of the above in plain English at runtime, plus the raw response body.

---

## `ping-sitemap.mjs`

```
node seo-pipeline/indexing/ping-sitemap.mjs [--check-urls [n]] [--indexnow] [--yes]
```

Checks, in order:

1. sitemap is fetchable, is XML (not the SPA HTML shell), and parses;
2. entry count and size are within the 50,000-URL / 50 MB limits;
3. **every `<loc>` uses the apex host** — flags any `www.` URL as an error (broken TLS);
4. duplicates, missing/unparseable `<lastmod>`, off-site URLs;
5. `robots.txt` exists, advertises the apex sitemap, and has no site-wide `Disallow: /`;
6. `--check-urls [n]` spot-checks that n sitemap URLs resolve (remember: on an SPA every path
   returns 200, so this proves routing, not content);
7. prints the deprecated ping endpoints as **SKIPPED** with what to use instead;
8. `--indexnow` chains into `indexnow.mjs --all` (still a dry run unless you add `--yes`).

Exits non-zero when it finds real problems, so it can gate a publish script.

---

## Notes / gotchas

- **Dry run is always the default.** Both scripts need an explicit `--yes` to send anything.
- **Commit `indexnow-key.json`.** Losing it means a new key, a new `public/<key>.txt`, and a fresh
  validation cycle. If you ever do regenerate, delete the old `public/<oldkey>.txt` — the script
  warns when it finds stale ones.
- **Commit `submitted.json`** or every machine/CI run will resubmit everything.
- **`--new` depends on `<lastmod>`.** If `generate-sitemap.mjs` stamps today's date on everything,
  `--new` degrades into `--all`. The API content hash is the backstop for blog posts.
- The deployed sitemap currently also contains legacy numeric URLs (`/blog/1` … `/blog/16`).
  They are submitted like any other URL; if they are redirects or dead, drop them from
  `generate-sitemap.mjs` rather than filtering here.
- Google will never appear in IndexNow results. For Google, the levers are the sitemap in
  Search Console and URL Inspection → Request Indexing: **[`gsc-setup.md`](./gsc-setup.md)**.
