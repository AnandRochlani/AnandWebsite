# SEO Article Spec — anandrochlani.com blog

Contract for every generated article. Drafts live in `seo-pipeline/articles/<order>-<slug>.json`
and are published verbatim by `publish.mjs` to `POST /api/admin/blog-posts`.

## Goal

Rank for long-tail system-design interview keywords and funnel readers to the Udemy course
**System Design Fundamentals for Interviews**
`https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73`

## Draft file shape (JSON)

```json
{
  "slug": "consistent-hashing-explained-system-design-interview-guide",
  "title": "Consistent Hashing Explained: A System Design Interview Guide (2026)",
  "description": "Meta description, 140-160 chars, contains primary keyword, ends with a hook.",
  "content": "<h2>...</h2><p>...</p>",
  "author": "Anand Rochlani",
  "date": "2026-07-31",
  "category": "System Design",
  "readTime": "9 min read",
  "featuredImage": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
  "featured": false,
  "series": "System Design Tutorial",
  "order": 10,

  "video": {
    "name": "Design a Parking Lot — Low-Level Design",
    "description": "What the video covers, 1-2 sentences.",
    "embedUrl": "https://www.youtube.com/embed/<id>",
    "thumbnailUrl": "https://i.ytimg.com/vi/<id>/maxresdefault.jpg",
    "uploadDate": "2026-08-08",
    "duration": "PT8M32S"
  }
}
```

**`video` is optional.** Add it only when the article actually embeds that lecture video
in its `content` — a `VideoObject` describing a video the page does not show is a
structured-data violation. When present, `prerender.mjs` emits a `VideoObject` block and
the page becomes eligible for a video rich result. `embedUrl` (or `contentUrl`),
`thumbnailUrl`, `name`, `description` and `uploadDate` are all required by Google;
`prerender.mjs` skips the block rather than emitting an incomplete one. `duration` is
ISO 8601 (`PT8M32S` = 8 min 32 s).

## Rules

**Title** — primary keyword first, then benefit, `(2026)` suffix. ≤ 65 chars if possible.
**Slug** — lowercase-hyphenated, contains primary keyword, no stop-word bloat, stable forever.
**description** — 140–160 chars, primary keyword once, natural sentence, no clickbait.

**content** (raw HTML string, no `<h1>` — the page renders the title as h1):

- Length: 1,300–1,900 words (7,000–10,000 chars of HTML). Never under 1,000 words.
- Open with an `<h2>` containing the primary keyword, then a 2–3 sentence hook stating the
  problem in interview terms (no "In this article we will…" filler).
- 5–8 `<h2>` sections; `<h3>` for sub-points. Section headings should match questions people
  search ("How does consistent hashing work?", "Why not use modulo hashing?").
- Short paragraphs (≤ 4 sentences). `<strong>` on first use of each key term.
- At least one real-world story/analogy (existing posts use Facebook growth, highway traffic).
- At least one `<ol>` or `<ul>` walk-through of the mechanism, step by step.
- Interview framing: one section titled like "How to talk about this in an interview" with a
  crisp 30-second answer the reader can memorize.
- **Internal links: 2–4** to other tutorials, format `<a href="/blog/<slug>">anchor text</a>`
  (relative URLs, keyword-rich but natural anchors). Link only slugs that exist (see queue +
  live list in `reference/live_posts_2026-07-31.json`).
- **Course CTA: exactly one**, placed after the main explanation (~70% through), format:

```html
<p><strong>Want to master this with video lessons and real case studies?</strong> This topic is
covered in depth in my Udemy course <a href="https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73" target="_blank" rel="sponsored noopener noreferrer">System Design Fundamentals for Interviews</a>
— 5.5 hours, rated 4.8★, built from real interview questions.</p>
```

- **One original diagram.** Add a spec to `seo-pipeline/diagrams/specs.mjs` keyed by the
  article slug, then `npm run seo:diagrams`. Do NOT hand-write `<figure>` markup into the
  content — `npm run seo:diagrams:inject` inserts it (before the second `<h2>` by default)
  and is idempotent. Alt text must be able to stand in for the image.
- End with `<h3>Key Takeaways</h3>` + `<ul>` (3–5 bullets), then `<h2>Next Steps</h2>` + one
  paragraph teasing the next article in the series (link it if published).
- **Never invent URLs**: no made-up YouTube links, no external references you are not sure
  exist. Wikipedia/official docs links are fine.
- No em-dash-heavy AI cadence, no "delve", no "In today's fast-paced world". Write like the
  existing posts: plain, direct, teacher's voice.

**readTime** — words/200, rounded, as "N min read".
**featuredImage** — pick from the verified pool in `content-plan.json` (`imagePool`). Do not
invent Unsplash IDs.
**date** — publish date (set by publish.mjs if empty).
**order** — next free number in the series; it drives prev/next navigation and sidebar order.

## QA gate (run before publish)

`node seo-pipeline/qa.mjs` checks every draft: field presence, description length, word count,
no h1, internal links resolve against queue+live slugs, exactly one CTA, no duplicate slugs.
