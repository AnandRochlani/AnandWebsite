---
id: follow-up
name: Follow-up (single, then stop)
subject: Re: {{original_subject}}
placeholders: first_name, original_subject, original_ask_short, new_thing, my_name
---

Hi {{first_name}},

Bumping this once in case it got buried — {{original_ask_short}}.

{{new_thing}}

If it's a no, no reply needed. I won't chase.

{{my_name}}

## How to personalize this

- **Send at most one of these.** The pipeline caps you at two follow-ups total and then moves the prospect to `lost` — respect it. Repeated chasing is what makes outreach feel like spam.
- `{{new_thing}}` should add something, not repeat the ask: a new article that fits better, a fixed dead link, a diagram you made since. If you have nothing new, the follow-up is just noise — consider skipping it.
- "If it's a no, no reply needed" genuinely raises reply rates and costs you nothing.
- Reply in the original thread so they have the context. Don't start a new one.
- Never write "just following up" three times, never fake urgency, never imply a prior agreement that didn't happen.
- Run `node seo-pipeline/backlinks/outreach.mjs due` to see who's actually due — don't follow up early.
