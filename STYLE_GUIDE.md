# AnandRochlani UI Style Guide — "Educative" design language

Reference: educative.io (July 2026). Light, product-grade SaaS edtech look. This REPLACES the
old purple/pink dark-gradient theme everywhere.

## Core palette

| Token | Value | Use |
|---|---|---|
| brand | `#5553FF` (indigo) | primary buttons, links, active nav, icons, accents |
| brand-dark | `#4341D6` | button hover |
| brand-soft | `#EEEEFF` | soft chip/badge backgrounds, icon tiles on white |
| ink | `#0D0B33` | dark hero/footer/section backgrounds (deep indigo-black) |
| ink-2 | `#171450` | gradient partner for ink (`bg-gradient-to-b from-ink to-ink-2`) |
| lavender | `#B9A8FF` | accent phrase inside dark-hero headlines |
| Page bg | `white` | default page background |
| Alt section | `slate-50` | alternating sections on light pages |
| Headings | `slate-900` | on light |
| Body text | `slate-600` | on light |
| Text on dark | `white` headings / `slate-300` body | |
| Borders | `slate-200` | card + divider borders on light |

Tailwind: use arbitrary values `bg-[#5553FF]`, `bg-[#0D0B33]`, etc. (defined as brand/ink in
tailwind.config extend.colors — prefer `bg-brand`, `bg-ink`, `text-lavender` etc.)

## Patterns

- **Page structure**: white body. Dark ink is ONLY for: hero band, stats/proof band, footer,
  and one CTA band per page. Everything else white or slate-50.
- **Nav**: white, `border-b border-slate-200`, sticky. Logo: brand icon tile + `text-slate-900
  font-bold`. Links `text-slate-600 hover:text-slate-900`, active `text-brand`. Right side:
  ghost link + one solid CTA `bg-brand text-white rounded-lg px-5 py-2.5 font-semibold
  hover:bg-brand-dark` ("Get the Course" → Udemy referral URL).
- **Hero (dark)**: `bg-gradient-to-b from-ink to-ink-2`, huge headline `text-4xl md:text-6xl
  font-extrabold text-white tracking-tight`, one phrase in `text-lavender`. Subhead
  `text-slate-300 text-lg md:text-xl`. Below: chip row of course-topic pills
  (`rounded-full bg-white/10 border border-white/15 text-slate-200 hover:bg-white/20`).
- **Cards** (courses, blog): `bg-white rounded-2xl border border-slate-200 shadow-sm
  hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden`. Image top,
  padded body, category chip `bg-brand-soft text-brand text-xs font-semibold rounded-full
  px-3 py-1`, title `text-slate-900 font-bold`, meta `text-slate-500 text-sm`.
- **Buttons**: primary `bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg`;
  secondary on light `border border-slate-300 text-slate-700 hover:border-brand hover:text-brand
  rounded-lg bg-white`; on dark `bg-white text-ink hover:bg-slate-100`.
- **Section headers**: eyebrow `text-brand font-semibold text-sm uppercase tracking-wider`,
  then `text-3xl md:text-4xl font-extrabold text-slate-900`, then `text-slate-600 text-lg`.
- **Stats/proof band**: ink background strip: big white numbers + slate-300 labels
  ("350+ students", "4.8★ rating", "49 lectures", "5.5 hours").
- **Testimonials**: white cards, bold outcome first line ("Cracked the interview at X"),
  then quote `text-slate-600`, then name `font-semibold text-slate-900` + role `text-slate-500`.
- **Footer**: `bg-ink text-slate-300`, multi-column link groups, white group headings,
  bottom bar `border-t border-white/10 text-slate-400`.
- Icons: lucide, `text-brand` on light tiles (`bg-brand-soft rounded-xl p-3`), white on brand.
- Radius: `rounded-2xl` cards, `rounded-lg` buttons/inputs, `rounded-full` chips.
- Motion: keep existing framer-motion patterns; hover lifts on cards; nothing bouncy.

## Hard rules

- NO purple/pink gradients (`from-purple-*`, `to-pink-*`, gradient text) anywhere.
- Never white text on white: every `text-white`/`text-slate-200` must sit on ink/brand bg.
- Do not change ANY logic: hooks, handlers, data fetching, routes, settings context, SEOHead
  props all stay byte-identical. Styling classes + static copy/layout markup only.
- Keep accessibility: focus states `focus-visible:ring-2 ring-brand ring-offset-2`, contrast
  ≥ 4.5:1 for body text.
