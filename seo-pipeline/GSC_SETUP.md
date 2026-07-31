# Google Search Console setup (one-time, ~10 minutes)

`gsc.mjs` automates sitemap submission and index monitoring through the official Search
Console API. It needs a service account added to your GSC property. You must do these steps
yourself (they require your Google account):

## 1. Verify the property (if not already)

1. Open https://search.google.com/search-console → Add property.
2. Choose **Domain** property, enter `anandrochlani.com` (covers apex + any subdomain).
3. Verify via the DNS TXT record it gives you (add at your DNS provider).
   - If DNS verification is awkward, use a **URL prefix** property `https://anandrochlani.com/`
     instead and set `GSC_PROPERTY='https://anandrochlani.com/'` when running gsc.mjs.

## 2. Create a service account + key

1. https://console.cloud.google.com → create (or pick) a project.
2. **APIs & Services → Library** → enable **Google Search Console API**.
3. **IAM & Admin → Service Accounts** → Create service account (name e.g. `gsc-pipeline`).
   No project roles needed.
4. Open the service account → **Keys → Add key → JSON**. Download the file.
5. Save it as `seo-pipeline/.gsc-service-account.json` (gitignored — never commit it).

## 3. Grant it access to the property

1. Copy the service account email (`gsc-pipeline@<project>.iam.gserviceaccount.com`).
2. Search Console → your property → **Settings → Users and permissions → Add user** →
   paste the email, permission **Full**.

## 4. Use it

```bash
node seo-pipeline/gsc.mjs submit    # submit sitemap.xml (once; resubmit after big batches)
node seo-pipeline/gsc.mjs status    # did Google fetch it? errors? discovered/indexed counts
node seo-pipeline/gsc.mjs inspect   # per-URL index coverage report → seo-pipeline/reports/
```

## What this deliberately does NOT do

- **No Google Indexing API.** It's restricted to JobPosting/BroadcastEvent pages; using it
  for blog content violates its terms and risks the property. Sitemap + URL inspection is
  the supported route for regular content.
- **No automated "Request indexing".** That action has no public API. For a just-published
  priority article, open it in the Search Console UI URL-inspection bar and click Request
  indexing manually — the inspect report tells you which URLs are worth the click.
