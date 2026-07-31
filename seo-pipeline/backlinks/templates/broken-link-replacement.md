---
id: broken-link-replacement
name: Broken link replacement
subject: Dead link on {{page_title}}
placeholders: first_name, page_url, page_title, dead_url, dead_anchor, error_code, my_url, my_url_title, my_name
---

Hi {{first_name}},

Small thing — on {{page_url}}, the link "{{dead_anchor}}" points at {{dead_url}}, which now returns {{error_code}}.

I write about the same topic and have a piece that covers what that page used to: {{my_url}} ({{my_url_title}}). Use it if it's a fit, or don't — either way I figured you'd want to know about the dead link.

{{my_name}}

## How to personalize this

- Verify the link is actually dead **the day you send**, and paste the exact status code. Being wrong about this destroys the whole pretext.
- Lead with the dead link. The replacement offer is the second half of the email and should feel optional — because it is.
- `{{my_url}}` must cover the *same topic* the dead page covered. Offering an unrelated page after reporting a dead link is the spam version of this tactic and page owners spot it instantly.
- One dead link per email. A list of eight reads like an automated audit and gets ignored.
- If they reply thanking you but don't add the link, say thanks and stop. Do not push.
- Use `monitor.mjs`'s link extraction against a resource page to find dead links in bulk, then send them one at a time, by hand.
