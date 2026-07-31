# What is automated, and what cannot be

Short answer: **about 80% of the work runs without you. The remaining 20% is the part
that actually earns rankings, and automating it is what gets sites penalised.**

This document is the map of that split.

---

## Layer 1 — fully automatic (no human, no AI, no API key)

Runs in GitHub Actions. Nothing to remember, nothing to trigger.

| Job | When | What it does |
|---|---|---|
| `seo-gate.yml` | every push/PR touching content | Lint, article QA (depth, metadata, internal links, CTA qualification), 34 validators, diagram staleness, full build + prerender + `validate-build`, internal-link integrity. **Fails the build** on any regression. |
| `seo-weekly.yml` | Mondays 06:00 IST | Pulls 28 days of Search Console data, runs the live technical audit, submits changed URLs to IndexNow, generates the weekly cockpit report, commits it, and opens a GitHub issue containing the week's decisions. |

The gate is the important one. It means a thin article, a duplicate title, a broken
canonical, a dead internal link or a stale diagram physically cannot reach production.
That class of problem — the kind that quietly costs you rankings for months — is now
impossible rather than merely unlikely.

### The weekly cockpit (`seo-pipeline/cockpit.mjs`)

This is the "I don't want to think about it" piece. Every Monday it answers four
questions from real data, applying the rules in `SEO_MASTER_PLAN_90_DAYS.md` §9:

1. **What do I refresh?** Pages sitting at position 8–20 with real impressions. Moving a
   page from 12 to 6 beats publishing a 40th article, so this list outranks the queue.
2. **What do I write?** Queries with >200 impressions and no dedicated page — these
   *override* the planned keyword for the week. If Search Console says nothing yet, it
   falls back to the week's assignment from `keyword-map.json`.
3. **What is cannibalising?** Any query where two of your URLs compete, with the merge
   instruction.
4. **Where am I against target?** Clicks, impressions and striking-distance queries
   versus the monthly targets in `keyword-map.json`.

Run it yourself any time:

```bash
npm run seo:cockpit
```

With no Search Console key it still emits the assignment and exits 0 — a missing key is
a setup gap, not a broken pipeline.

---

## Layer 2 — automatic draft, human approve (5 minutes a week)

Article drafting is automated via the `/seo-article` skill against `keyword-map.json`,
and the QA gate is automated. **Publishing stays behind a human read.**

This is a deliberate line, not laziness. Google's spam policy on *scaled content abuse*
targets mass-produced pages made primarily to rank, and a DR-0 domain that starts
auto-publishing unread AI articles matches that pattern precisely. This site exists to
funnel to a paid course; a manual action on it is not a setback, it is the end of the
channel. Five minutes of reading per article is the cheapest insurance you will ever buy.

What "approve" actually means: skim the draft for anything factually wrong or
embarrassing, confirm the diagram matches the argument, merge. That is it.

---

## Layer 3 — cannot be automated (and should not be)

| Work | Why not |
|---|---|
| **Earning backlinks** | A backlink is another human deciding you are worth citing. Every tool that automates this — mass outreach, PBNs, directory blasts, comment drops — produces links SpamBrain already discounts, and risks a manual action. This is the single highest-value activity in the plan and it stays manual: ~5 personalised emails a week. |
| **Search Console / GA4 / Bing verification** | One-time, requires your Google account. ~15 minutes total, then never again. |
| **YouTube uploads** | Your channel, your face, your brand. The *schema* side is automated (add a `video` field to an article and it emits `VideoObject`); the upload is not. |
| **Strategic pivots** | "Stop feeding the Amazon cluster", "LLD is working, double it" — the cockpit surfaces the evidence, you make the call. Monthly, 20 minutes. |
| **Community participation** | Answering questions genuinely on Reddit/Discord/LinkedIn. Automating this is spam, and it is also the fastest traffic source you have this quarter. |

---

## Setup — one time, ~20 minutes

1. **GSC service account** — follow `GSC_SETUP.md`, then add the key JSON as the GitHub
   repository secret `GSC_SERVICE_ACCOUNT_JSON` (Settings → Secrets and variables →
   Actions). Without it the weekly job still runs, just without data.
2. **Enable Actions** on the repo if it is off, and allow "Read and write permissions"
   for the workflow token (Settings → Actions → General → Workflow permissions) — the
   weekly job commits its report and opens an issue.
3. **Create the `seo` label** (or drop `--label seo` from the workflow).
4. Verify by running the weekly job manually once: Actions → *SEO weekly* → Run workflow.

The key is written to `seo-pipeline/.gsc-service-account.json` at runtime and deleted in
an `always()` step before anything can commit it. It is also gitignored.

---

## Your actual weekly commitment after this

| | Time |
|---|---|
| Read the Monday issue, decide | 10 min |
| Approve 2 article drafts | 10 min |
| 5 outreach emails | 30 min |
| 1 video upload | 20 min |
| Community answers | 20 min/day |

Roughly **2 hours a week**, and none of it is remembering to run a script.
