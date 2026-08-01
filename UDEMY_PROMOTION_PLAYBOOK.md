# Udemy Promotion Playbook

**Date:** 31 July 2026
**Courses:** System Design Fundamentals for Interviews (live) · Amazon Coding Interview
Patterns (in production) · Google Coding Interview: 50 Problems (in production)

This answers "what else can we do beyond on-site SEO". On-site SEO is close to its
practical ceiling; the channels below are where the remaining growth is.

---

## 0. The uncomfortable premise

anandrochlani.com is one of several inputs to Udemy sales, and probably not the largest.
Roughly, a Udemy course gets students from three places:

1. **Udemy's own search and recommendation engine** — the biggest by far for most courses,
   and it is optimisable. Almost nobody does this work.
2. **Your owned audience** — blog, YouTube, LinkedIn, email.
3. **Paid** — Udemy's ad programme, or your own.

The blog is (2). It is worth doing, and it is also the slowest of the three. **Section 1 is
the highest-return work in this document and it does not touch the website at all.**

---

## 1. Udemy-internal SEO — do this first

Udemy's search ranks on relevance to the title, subtitle, and course description, then
weights enrolment velocity, rating, completion and recency of updates. The listing is a
search result page you control and are probably underusing.

**Title and subtitle.** The title carries the head keyword; the subtitle carries the rest.
"System Design Fundamentals for Interviews" is clean but narrow — the subtitle should pick
up "system design interview questions", "scalability", "distributed systems", "HLD" and
"FAANG", because Udemy indexes it.

**Description.** Udemy's description field supports far more length than most instructors
use, and it is fully indexed. Restate the problem, the outcome, and the syllabus in prose,
using the phrasings learners actually type. Every case study by name.

**Course "topics".** Udemy lets you attach topics — these drive category browse pages,
which are a real discovery surface. Attach every relevant one.

**Instructor profile.** It ranks in Google for your name and links out. Fill it out with
the anandrochlani.com link, the YouTube channel, and LinkedIn.

**Free preview lessons.** Preview completion strongly predicts purchase. Make the previewed
lessons the ones that demonstrate teaching quality, not the ones that explain the syllabus.

**Update cadence.** Udemy surfaces "Last updated" and factors freshness. Adding a lecture
or refreshing a section every couple of months is a genuine ranking input, and cheap given
you already have a video pipeline.

**Reviews.** Rating and review count gate everything else. 350 students at 4.8★ is a good
base and a small absolute number — a polite in-course prompt after the first case study
(not at lesson 1) is the standard, non-manipulative way to lift review volume.

---

## 2. YouTube — the highest-leverage owned channel you already have

You have @anandrochlani5226, and — critically — you already have a **rendered-video
pipeline**: 101 Amazon MP4s exist today, plus the LLD and web-dev course renders.

This is unusual. Most instructors are blocked on production; you are blocked on
distribution. That asymmetry is the single biggest opportunity in this document.

**Why YouTube specifically.** It is the second-largest search engine, its results appear in
Google SERPs, and interview-prep intent is overwhelmingly video-first. A "Sliding Window
Explained" video and the article of the same name do not compete — they compound.

**The mechanic:**

- Publish one full lesson per week as a standalone video. Not a trailer — a complete,
  genuinely useful lesson. The course sells because the free lesson was good, not despite it.
- Title for YouTube search, not for the curriculum. `L14 — Fixed Window` is invisible;
  "Sliding Window Pattern — Why Your Solution Times Out" is searched.
- Pin a comment linking the matching blog article. Put the Udemy link in the description,
  below the fold, with a UTM.
- Cut 45–60 second vertical clips from existing renders for Shorts/Reels/TikTok. The
  "brute force → why it times out" beat is already structured as a hook; it needs no
  re-recording.
- End screens to the next lesson, not to the course. Watch time first, conversion second.

**Realistic expectation:** this is a 6–12 month channel, not a 6-week one. Start now
precisely because it is slow.

---

## 3. The launch sequence for the two DSA courses

They are in production, which is an advantage if you use it.

**Now (pre-launch):**
- The course pages are live and indexable with the full curriculum. They begin accumulating
  age and impressions before there is anything to sell — that is the point of publishing
  them early.
- Add an email capture on both pages. There is none today, and "notify me when this
  launches" is the single highest-intent signal you can collect. A launch-day email to even
  200 addresses beats any first-week ad spend.
- Publish the free written pattern guides on the matching cadence, each linking to its
  course page.

**Launch week:**
- Set `status: "published"`, add `externalUrl` with the referral code, add `rating` and
  `studentsEnrolled` once real, and remove the "IN PRODUCTION" state (all in
  `src/data/courses.js` — one edit each).
- Udemy weights early enrolment velocity heavily. Concentrate the launch: email list,
  YouTube, LinkedIn and the blog on the same day, with a launch coupon.
- Ask early students for reviews after they finish a section.

**Do not** create the Udemy listing until the course is ready. An empty or thin listing
accrues bad early signals that are hard to shake off.

---

## 4. Linkable assets and earned links

You cannot outrank an established competitor for "system design interview" without links.
The assets that earn them already exist — they just are not being pitched.

**Strongest candidates:**
- The 15-patterns pillar with its recognition-signal table — the most referenceable page
  on the site.
- The back-of-the-envelope estimation guide (worked numbers are quotable).
- The System Design roadmap SVG and the interview checklist.
- The 25 original diagrams, once injected — images get embedded with attribution.

**Where links actually come from, in order of realism:**
1. **Answering questions properly.** Reddit (r/cscareerquestions, r/leetcode,
   r/ExperiencedDevs), Stack Overflow, Discord study servers. Write a genuinely complete
   answer; link only when the link adds something the answer did not. Most of these are
   nofollow — they still bring qualified traffic, and traffic precedes links.
2. **Newsletters and roundups.** ByteByteGo-adjacent newsletters, "best free system design
   resources" lists, university CS-club resource pages. A short, specific pitch naming the
   one asset you think fits works; a template does not.
3. **Guest posts and cross-posts.** dev.to, Hashnode and Medium accept canonical
   cross-posts. Publish the canonical on your domain, cross-post after a week with
   `rel=canonical` back.
4. **Being cited by other course creators.** Diagrams with attribution baked in make this
   frictionless.

**Explicitly do not:** buy links, use automated backlink software, run comment or forum
drops, or join sitewide link exchanges. These are neutralised by SpamBrain at best, and a
manual action on the funnel domain is not worth any short-term gain.
See [feedback: no black-hat SEO].

---

## 5. Email — the missing asset

There is no email capture anywhere on the site. For a course business this is the largest
structural gap.

Search traffic is rented; a list is owned. The natural magnets already exist: the System
Design interview checklist, the roadmap SVG, and the pattern-selector cheat sheets sitting
in both DSA repos. A "get the 15-pattern cheat sheet" form on the pillar article and both
course pages costs one afternoon and compounds from day one.

Then: a short onboarding sequence (5 emails, one per key concept), each ending with the
relevant course. This converts far better than a blog CTA because the reader opted in.

---

## 6. LinkedIn

For this audience LinkedIn outperforms X. Interview prep is career content and the audience
is already there.

- Post the substance, not a link — LinkedIn suppresses posts with external links. Put the
  article as the first comment.
- The diagrams are native LinkedIn content as-is: one image, a short "here is the mistake
  everyone makes" caption, and the link in the comments.
- Your Salesforce MTS title is real credibility here. Use it.

---

## 7. What not to bother with

- **A 26th System Design article on a topic already covered.** Expand or merge instead.
- **Chasing 100 posts.** The counted topic inventory for this niche is roughly 65 winnable
  queries. Beyond that you are padding, and padding is a quality signal in the wrong
  direction.
- **Publishing everything at once.** Batches of 2–5 are unremarkable; a low-authority
  domain jumping 25 → 70 pages in a day is a scaled-content-abuse pattern.
- **Paid ads before the funnel is measurable.** Without analytics and per-channel UTMs you
  cannot tell a good campaign from a bad one, so you would be buying noise.

---

## 8. If you only do five things

1. Rewrite the Udemy title, subtitle, description and topics for the live course.
2. Publish one existing rendered lesson to YouTube every week.
3. Add email capture with the cheat sheet as the magnet.
4. Connect Search Console and let real query data drive the article queue.
5. Send three genuine outreach or community contributions per week.

Items 1–3 do not touch this repository at all, and between them they are worth more than
the next twenty articles.
