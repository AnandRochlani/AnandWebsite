# Backlinks — off-page SEO operations for anandrochlani.com

A tracking and drafting system for **human** link building. It holds a researched list of
legitimate link opportunities, walks each one through an outreach pipeline with enforced
follow-up discipline, drafts the emails, and then monitors the links you actually earn.

**It never places a link and it never sends an email.** Every command either reads the web
or writes a file. Pressing send is your job, from your own mail client, after reading what
you are about to send.

Zero npm dependencies — Node 18+ built-ins only (`fetch`, `node:fs`, `node:path`).

---

## Why this exists instead of an automated submitter

The original ask was a Money Robot-style tool: mass-create accounts on Web 2.0 sites, forums,
wikis and bookmarking services, solve the CAPTCHAs, and blast spun articles with links back.
That was declined, and this is the replacement. The reasons are practical, not moralistic:

- **Google's link spam policy names exactly that behaviour.** Automated link placement, links
  in low-quality directories/bookmark sites, forum and comment links with optimised anchors,
  and "widely distributed articles with links in them" are all listed as link spam.
- **SpamBrain neutralises those links rather than counting them.** Since the December 2022
  link spam update the normal outcome is not a manual penalty — it is that the links are
  simply ignored. You pay the cost and get zero. The bad outcome (a manual action against
  `anandrochlani.com`, which then has to be disavowed and reconsidered) is the tail risk.
- **This domain has one asset: topical authority in system design.** It funnels to a paid
  Udemy course under a real name and a real YouTube channel. Attaching that identity to a
  spam network is a bad trade at any conversion rate.
- **The mechanics are their own problem.** Automated account creation and CAPTCHA bypass
  violate the terms of service of essentially every site involved, independent of SEO.

So: no automated account creation, no CAPTCHA solving, no auto-posting, no comment drops,
no article spinning, no PBNs, no bulk submission. Not configurable, not behind a flag.

---

## Files

```
prospects.json     75 researched targets, seeded by hand. Read this before pitching anything.
pipeline.json      outreach state (generated / hand-editable)
outreach.mjs       pipeline manager + email drafter        --help
monitor.mjs        earned-link health checker              --help
templates/         7 outreach email templates with {{placeholders}}
lib.mjs            shared helpers (state machine, HTTP, anchor extraction)
drafts/            rendered email drafts (gitignored)
```

Monitor output lands in `seo-pipeline/reports/backlinks-monitor.json`.

---

## Quick start

```bash
cd /Users/ar/AnandWebsite

# 1. See what's worth pitching, best fit first
node seo-pipeline/backlinks/outreach.mjs prospects --type resource-list
node seo-pipeline/backlinks/outreach.mjs prospects --min-relevance 5

# 2. Pull one into the pipeline (prints its approach + rules — read them)
node seo-pipeline/backlinks/outreach.mjs add gh-awesome-scalability

# 3. Research it, then record that
node seo-pipeline/backlinks/outreach.mjs move gh-awesome-scalability researched \
  --note "Case Studies section, needs a URL-shortener entry"

# 4. Draft the email (stdout, or --out to write a file)
node seo-pipeline/backlinks/outreach.mjs draft gh-awesome-scalability \
  --template resource-page-suggestion --set first_name=Binh --out

# 5. Send it yourself. Then tell the pipeline.
node seo-pipeline/backlinks/outreach.mjs move gh-awesome-scalability contacted

# 6. Every morning
node seo-pipeline/backlinks/outreach.mjs due

# 7. When one lands
node seo-pipeline/backlinks/outreach.mjs move gh-awesome-scalability won \
  --link-url https://github.com/binhnguyennus/awesome-scalability

# 8. Monthly link health check
node seo-pipeline/backlinks/monitor.mjs
```

---

## `outreach.mjs`

| Command | What it does |
| --- | --- |
| `prospects` | List the seeded catalogue. `--type`, `--min-relevance`, `--difficulty`, `--verify`, `--json` |
| `list` | List pipeline entries. `--state`, `--type`, `--limit`, `--json` |
| `add <id>` | Add a catalogue prospect, or an ad-hoc target via `--url --name --type` |
| `show <id>` | Full detail, notes, and state history for one entry |
| `move <id> <state>` | Transition an entry (validated; `--force` to override). `--link-url` on `won` |
| `note <id> <text>` | Append a dated note |
| `followup <id>` | Record a follow-up. Refuses if it is too early or the cap is hit |
| `due` | What needs action today, plus what is about to lapse |
| `sweep [--apply]` | Close out lapsed entries to `lost` |
| `draft <id>` | Render an email from a template. `--template`, `--set k=v`, `--out` |
| `templates` | List templates and their placeholders |
| `stats` | Counts by state and type, reply rate, win rate, link inventory |

### States

```
identified → researched → contacted → replied → won
                                    ↘ lost / nurture
```

- `identified` — in the catalogue, not researched yet
- `researched` — you have read the target, found a named contact, and know your angle
- `contacted` — pitch sent (by you, by hand)
- `replied` — they responded; ball is in your court
- `won` — the link exists. Set `--link-url` so `monitor.mjs` can watch it
- `lost` — closed. Revisit later with `move <id> nurture`
- `nurture` — worth keeping warm, no active outreach

### Follow-up discipline (the point of the tool)

Configured in `pipeline.json → config`:

- First follow-up becomes due **7 days** after contact (`followUpDays`)
- **Maximum 2** follow-ups (`maxFollowUps`) — `followup` refuses a third
- 7 days after the last follow-up with no reply, the entry **lapses**; `due` flags it and
  `sweep --apply` moves it to `lost`
- Following up early is refused unless you pass `--force`

This is deliberately restrictive. The difference between outreach and spam is almost entirely
volume and persistence, and the tool is where that discipline should live rather than in your
memory at 11pm.

---

## `monitor.mjs`

Checks every `won` entry that has a `linkUrl`. For each linking page it fetches the HTML and:

- confirms an `<a href>` to `anandrochlani.com` is still present
- records the **anchor text** and diffs it against the previous run
- records the **`rel`** attribute and flags a followed link that quietly became
  `nofollow` / `ugc` / `sponsored`
- flags removals, 404s, unreachable hosts, and redirects
- flags a linking page that is `meta robots noindex` (it passes nothing)
- flags any link pointing at **`www.anandrochlani.com`** — that host has a broken TLS
  certificate, so a www link is a defect to get corrected, not a win

```bash
node seo-pipeline/backlinks/monitor.mjs                 # everything
node seo-pipeline/backlinks/monitor.mjs --limit 5       # first five
node seo-pipeline/backlinks/monitor.mjs --delay 4000    # extra polite
node seo-pipeline/backlinks/monitor.mjs --url https://some.site/resources --no-write
```

Options: `--limit`, `--delay` (default 2000ms, min 250), `--concurrency` (default 1, max 3),
`--timeout`, `--url` (repeatable, ad-hoc), `--state`, `--out`, `--no-write`, `--json`,
`--strict`.

Politeness is not optional: one request at a time by default, a real pause between them, and a
descriptive User-Agent that identifies the site and the purpose. Do not raise concurrency to
audit someone's whole domain — that is a crawl, and this is not a crawler.

**Report:** `seo-pipeline/reports/backlinks-monitor.json`, with a printed diff against the
previous run. Exit code `1` when something **regressed** since last time (with `--strict`,
also when anything is broken at all) — safe to wire into a monthly cron.

The `--url` mode is also how you audit a prospect's resource page for dead links before
pitching it — see `templates/broken-link-replacement.md`.

---

## Templates

All in `templates/`, markdown with `{{placeholders}}` and a **"How to personalize this"**
section that `draft` prints but never puts in the email.

| Template | Use it for |
| --- | --- |
| `guest-post-pitch` | Contributor pitches (freeCodeCamp, InfoQ, HackerNoon, LogRocket) |
| `broken-link-replacement` | You found a dead link on their page and have the replacement |
| `resource-page-suggestion` | .edu resource pages, student chapters, curated lists |
| `unlinked-mention-claim` | Someone mentioned you without linking — highest reply rate here |
| `newsletter-pitch` | Curated newsletters and link roundups |
| `podcast-pitch` | Guest spots |
| `follow-up` | The single follow-up. Then stop |

Three rules that matter more than the wording:

1. **One specific, verifiable detail from their page**, or don't send it. The proof that you
   read their site is the entire pitch.
2. **Never lead with the Udemy course.** Page owners who suspect they are being used as a
   funnel say no. Lead with the free article; the course sells itself downstream.
3. **Never offer or accept payment for a link**, and never do reciprocal link deals. Both are
   link schemes. If a site offers you a paid placement, the correct answer is no — and if you
   ever do buy a placement for traffic reasons, it must carry `rel="sponsored"`.

---

## What actually earns links for a site like this

Honest version, because most link-building effort on a site like this is wasted.

**Works (in rough order of return):**

1. **Original data.** A survey of 200 engineers on what system design rounds actually asked
   them this year. A benchmark you ran yourself. Anything with a number nobody else has.
   People cite numbers; they do not cite explanations. This is the single biggest lever
   available and nothing on the prospect list beats it.
2. **A free tool.** A capacity-estimation calculator, a back-of-envelope latency cheat sheet,
   a consistent-hashing visualiser. Tools get bookmarked, listed, and linked for years by
   people you never contacted. Also the only realistic Hacker News / Show HN entry.
3. **Diagrams people can reuse.** Publish the architecture diagrams under a clear licence and
   ask only for attribution. Diagrams get embedded, and embeds come with links.
4. **Genuinely best-in-class explainers.** Not "good" — the one a professor would link instead
   of writing their own. That is what makes a `.edu` resource-page pitch land, and `.edu`
   resource pages are the highest-value realistic dofollow target on the list.
5. **Being a person.** Answering well on Stack Exchange, merging PRs to the awesome lists,
   showing up in the same threads for a year. Slow, compounding, and the reason the
   community entries in `prospects.json` are marked "traffic" rather than "link".
6. **Unlinked-mention reclamation.** Quarterly search, one polite email. Cheapest win there is.
7. **The YouTube channel.** Cross-linking video ↔ post is free, already yours, and drives
   the branded search that makes everything else easier.

**Wastes time (or worse):**

- Mass directory submission. The listed course directories (Class Central, Hackr.io) are worth
  a one-time listing; generic "submit your site to 500 directories" is worth nothing.
- Blog comment links, forum signature links, profile-link farming. Ignored at best.
- Guest posts on sites that exist to publish guest posts. If they will take anything, the link
  is worth nothing — that is precisely the signal.
- Buying links, "link exchange" partnerships, and anyone who emails offering a DA-50 placement
  for $80. All link schemes.
- Cross-posting to Medium/DEV **without a canonical URL**. That is not link building, it is
  competing against yourself in search results.
- Chasing volume. 10 personalised, well-targeted emails beat 500 templated ones, and the 500
  cost you a domain reputation.
- Optimised anchor text at scale. Natural anchors are the brand name, the page title, or a
  plain phrase. A pattern of exact-match keyword anchors from unrelated sites is one of the
  clearest link-spam signals there is — and the anchor text `monitor.mjs` records is there so
  you can watch your own profile stay natural.

**Prerequisites worth fixing first**, because they gate several channels above:

- The site should serve an **RSS feed** — daily.dev source submission and several newsletter
  curators want one.
- The SPA renders client-side (already flagged in `../README.md`). Prerendering blog routes
  would help every link you earn actually count.
- The thin 200–400 word tutorials in `expansionBacklog` are not linkable yet. Do not pitch a
  post that a curator will open and dismiss in four seconds — expand it first.

---

## Prospect catalogue

`prospects.json` holds 75 hand-researched targets. Every URL was checked (HTTP 200, or a 403
from a bot-blocker on a domain that certainly exists) when the file was seeded on 2026-07-31.
Entries whose *submission path* or *current policy* could not be confirmed carry
`"verify": true` — check those before spending effort.

| Type | Count | Read this first |
| --- | --- | --- |
| `resource-list` | 15 | Awesome lists + subreddit wikis. Best realistic wins. One precise PR each |
| `guest-post` | 12 | freeCodeCamp and InfoQ are the real dofollow prizes; Medium pubs are traffic only |
| `newsletter` | 12 | Say the link is yours. One link, not every week |
| `community` | 10 | Nearly all nofollow. Contribute for weeks before you ever post a link |
| `edu-resource-page` | 7 | Includes two search-recipe "plays" — turn each page you find into its own entry |
| `aggregator` | 5 | HN/Lobsters/daily.dev. Never ask for upvotes |
| `directory` | 5 | Class Central is legitimate; judge the small aggregators before submitting |
| `qa` | 3 | Stack Exchange requires disclosing that the link is yours. Answer fully first |
| `podcast` | 2 | Pitch the episode, not yourself |
| `owned` | 4 | YouTube, GitHub, Udemy profile, unlinked-mention reclamation. Do these first |

Each entry carries `why` (why it fits this site), `approach` (the concrete first move),
`rules` (the self-promotion rules to respect), `relevance`, `difficulty`, `payoff`
(link vs traffic — be honest with yourself about which), and `linkAttr`.

**Read `rules` before you post anything.** Several entries exist specifically to be *skipped* —
ByteByteGo and InterviewReady are direct competitors, MIT 6.824 links papers not tutorials, and
r/ExperiencedDevs will remove a blog link and the account with it. Knowing what not to do is
half of what this file is for.

---

## Suggested cadence

- **Weekly:** `due`, act on it, add 2–3 new prospects, send at most 5 genuinely personalised
  emails. Never batch-send.
- **Monthly:** `monitor.mjs`, read the diff, fix what regressed. `stats` to see whether the
  targeting is working — a near-zero reply rate means the pitch or the list is wrong, and
  sending more is the wrong fix.
- **Quarterly:** run the unlinked-mention searches (`unlinked-mentions-play` in
  `prospects.json`), re-check `verify: true` entries, and `sweep --apply`.
- **Continuously:** publish the thing that makes all of this easy — the data, the tool, the
  explainer that is obviously the best one. Outreach amplifies an asset; it cannot substitute
  for one.
