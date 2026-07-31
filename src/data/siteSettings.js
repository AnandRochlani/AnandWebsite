// Default site-wide settings.
//
// These are seeded into the `site_settings` table on first deploy and also
// used as a hardcoded fallback on the client when /api/public/settings is
// unreachable (e.g. local dev without DATABASE_URL).
//
// To add a new editable field:
//   1. Append a new entry below with a unique `key`, sensible `value`,
//      `category` (groups settings in the admin UI), and `type`
//      (controls which input is rendered).
//   2. Read it in a component via the SiteSettings context:
//        const { get } = useSiteSettings();
//        const title = get('home.hero.title', 'Default title');
//   3. (Optional) seedIfEmpty() will pick the new key up automatically;
//      ON CONFLICT DO NOTHING keeps existing edited values intact.
//
// Supported `type` values (rendered by the admin Settings tab):
//   - text        : single-line input
//   - textarea    : multi-line textarea
//   - image_url   : url input (renders a small preview)
//   - url         : plain url input
//   - boolean     : toggle
//   - json        : raw JSON editor (used for arrays/objects)

export const defaultSiteSettings = [
  // ── Hero (HomePage) ─────────────────────────────────────────────
  {
    key: 'home.hero.badge',
    value: 'System Design, made practical',
    category: 'hero',
    type: 'text',
    label: 'Hero badge text',
    sortOrder: 10,
  },
  {
    key: 'home.hero.title.line1',
    value: 'Understand System Design.',
    category: 'hero',
    type: 'text',
    label: 'Hero title — line 1',
    sortOrder: 20,
  },
  {
    key: 'home.hero.title.line2',
    value: 'Explain it with confidence.',
    category: 'hero',
    type: 'text',
    label: 'Hero title — line 2 (accent)',
    sortOrder: 30,
  },
  {
    key: 'home.hero.subtitle',
    value:
      'Build strong fundamentals with a clear tutorial path, practical architecture case studies, and an interview-focused course.',
    category: 'hero',
    type: 'textarea',
    label: 'Hero subtitle',
    sortOrder: 40,
  },
  {
    key: 'home.hero.image',
    value: 'https://images.unsplash.com/photo-1504983875-d3b163aba9e6',
    category: 'hero',
    type: 'image_url',
    label: 'Hero background image URL',
    sortOrder: 50,
  },
  {
    key: 'home.hero.cta_primary.label',
    value: 'Start with free tutorials',
    category: 'hero',
    type: 'text',
    label: 'Primary CTA label',
    sortOrder: 60,
  },
  {
    key: 'home.hero.cta_primary.path',
    value: '/blog',
    category: 'hero',
    type: 'text',
    label: 'Primary CTA path',
    sortOrder: 70,
  },
  {
    key: 'home.hero.cta_secondary.label',
    value: 'Explore the course',
    category: 'hero',
    type: 'text',
    label: 'Secondary CTA label',
    sortOrder: 80,
  },
  {
    key: 'home.hero.cta_secondary.path',
    value: '/courses',
    category: 'hero',
    type: 'text',
    label: 'Secondary CTA path',
    sortOrder: 90,
  },

  // ── Feature cards (HomePage) ────────────────────────────────────
  {
    key: 'home.feature.blog.title',
    value: 'Learn one concept at a time',
    category: 'features',
    type: 'text',
    label: 'Blog feature card — title',
    sortOrder: 10,
  },
  {
    key: 'home.feature.blog.description',
    value:
      'Follow the free System Design tutorial series from latency and throughput through databases, caching, and complete case studies.',
    category: 'features',
    type: 'textarea',
    label: 'Blog feature card — description',
    sortOrder: 20,
  },
  {
    key: 'home.feature.courses.title',
    value: 'Learn with a guided course',
    category: 'features',
    type: 'text',
    label: 'Courses feature card — title',
    sortOrder: 30,
  },
  {
    key: 'home.feature.courses.description',
    value:
      'Use a structured curriculum when you want a focused path, practical explanations, and preparation you can revisit before interviews.',
    category: 'features',
    type: 'textarea',
    label: 'Courses feature card — description',
    sortOrder: 40,
  },

  // ── Footer ──────────────────────────────────────────────────────
  {
    key: 'footer.brand_name',
    value: 'AnandRochlani',
    category: 'footer',
    type: 'text',
    label: 'Brand name',
    sortOrder: 10,
  },
  {
    key: 'footer.tagline',
    value:
      'System design tutorials, interview case studies, and practical courses for software engineers.',
    category: 'footer',
    type: 'textarea',
    label: 'Footer tagline',
    sortOrder: 20,
  },
  {
    key: 'footer.copyright',
    value: '© 2026 AnandRochlani. Practical System Design learning for software engineers.',
    category: 'footer',
    type: 'text',
    label: 'Copyright line',
    sortOrder: 30,
  },
  {
    key: 'footer.quick_links',
    value: [
      { name: 'Home', path: '/' },
      { name: 'Courses', path: '/courses' },
      { name: 'Blog', path: '/blog' },
      { name: 'About', path: '/about' },
      { name: 'Jobs', path: '/jobs' },
      { name: 'Saved Items', path: '/saved-courses' },
    ],
    category: 'footer',
    type: 'json',
    label: 'Quick links (array of {name, path})',
    sortOrder: 40,
  },

  // ── Social links ────────────────────────────────────────────────
  {
    key: 'social.links',
    value: [
      { icon: 'Youtube', href: 'https://www.youtube.com/@anandrochlani5226', label: 'YouTube', external: true },
      { icon: 'Linkedin', href: 'https://in.linkedin.com/in/anand-rochlani', label: 'LinkedIn', external: true },
      { icon: 'Mail', href: 'mailto:contact@anandrochlani.com', label: 'Email', external: false },
    ],
    category: 'social',
    type: 'json',
    label: 'Social links (array of {icon, href, label, external})',
    description:
      'icon must be one of: Youtube, Linkedin, Github, Twitter, Mail. Set external=true to open in new tab.',
    sortOrder: 10,
  },

  // ── SEO defaults ────────────────────────────────────────────────
  {
    key: 'seo.site_url',
    value: 'https://anandrochlani.com',
    category: 'seo',
    type: 'url',
    label: 'Site URL (no trailing slash)',
    sortOrder: 10,
  },
  {
    key: 'seo.site_name',
    value: 'AnandRochlani',
    category: 'seo',
    type: 'text',
    label: 'Site / organization name',
    sortOrder: 20,
  },
  {
    key: 'seo.default_title',
    value: 'System Design Tutorials & Courses | AnandRochlani',
    category: 'seo',
    type: 'text',
    label: 'Default page title',
    sortOrder: 30,
  },
  {
    key: 'seo.default_description',
    value:
      'Free System Design tutorials for interview prep — caching, sharding, consistent hashing, load balancing and full case studies.',
    category: 'seo',
    type: 'textarea',
    label: 'Default meta description',
    sortOrder: 40,
  },
  {
    key: 'seo.default_keywords',
    value:
      'system design, system design interview, distributed systems, scalability, caching, load balancing, software architecture',
    category: 'seo',
    type: 'textarea',
    label: 'Default meta keywords',
    sortOrder: 50,
  },
  {
    key: 'seo.default_og_image',
    value: 'https://anandrochlani.com/og-image.jpg',
    category: 'seo',
    type: 'image_url',
    label: 'Default Open Graph image',
    sortOrder: 60,
  },
  {
    key: 'seo.logo_url',
    value: 'https://anandrochlani.com/logo.png',
    category: 'seo',
    type: 'image_url',
    label: 'Logo URL (used in JSON-LD)',
    sortOrder: 70,
  },
];

// Build a quick { key: value } map of the defaults for use as a client-side
// fallback when the public settings endpoint is unreachable.
export function getDefaultSettingsMap() {
  const out = {};
  for (const s of defaultSiteSettings) out[s.key] = s.value;
  return out;
}
