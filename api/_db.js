import { neon } from '@neondatabase/serverless';

import { defaultCourses } from '../src/data/courses.js';
import { blogPosts as seededBlogPosts } from '../src/data/blogPosts.js';
import { defaultSiteSettings } from '../src/data/siteSettings.js';
import { slugify } from '../src/lib/slug.js';

function getDatabaseUrl() {
  let url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL;

  if (!url) {
    throw new Error(
      'Missing database connection string. Set DATABASE_URL (recommended) or POSTGRES_URL in Vercel env vars.'
    );
  }

  url = String(url).trim();

  // Allow common copy/paste mistake: `psql 'postgresql://...'`
  // Vercel env var must be ONLY the URL.
  if (/^psql\b/i.test(url)) {
    url = url.replace(/^psql\b/i, '').trim();
  }

  // Strip surrounding quotes if present
  const first = url[0];
  const last = url[url.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    url = url.slice(1, -1).trim();
  }

  try {
    // Validate URL format early for clearer errors
    // eslint-disable-next-line no-new
    new URL(url);
  } catch (e) {
    throw new Error(
      `Database connection string provided to neon() is not a valid URL. ` +
        `Set DATABASE_URL to only the URL, e.g. ` +
        `postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require`
    );
  }

  return url;
}

export function getSqlClient() {
  const url = getDatabaseUrl();
  return neon(url);
}

export async function ensureSchema(sql) {
  // Courses
  await sql`
    CREATE TABLE IF NOT EXISTS courses (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT,
      description TEXT,
      instructor TEXT,
      instructor_bio TEXT,
      level TEXT,
      duration TEXT,
      price TEXT,
      category TEXT,
      rating DOUBLE PRECISION,
      students_enrolled TEXT,
      featured_image TEXT,
      featured BOOLEAN DEFAULT FALSE,
      is_external BOOLEAN DEFAULT FALSE,
      external_url TEXT,
      modules JSONB,
      learning_outcomes JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Migration for tables created before the slug column existed.
  // ADD COLUMN IF NOT EXISTS is idempotent on Postgres 9.6+.
  await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug TEXT;`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_unique_idx
    ON courses (slug)
    WHERE slug IS NOT NULL;
  `;

  // Blog posts
  await sql`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id BIGSERIAL PRIMARY KEY,
      slug TEXT UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      author TEXT,
      date DATE,
      category TEXT,
      read_time TEXT,
      featured_image TEXT,
      featured BOOLEAN DEFAULT FALSE,
      series TEXT,
      series_order INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Site settings (key/value, with metadata so the admin UI can render edit
  // forms without hardcoding which keys exist)
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value JSONB,
      category TEXT NOT NULL DEFAULT 'general',
      type TEXT NOT NULL DEFAULT 'text',
      label TEXT,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
}

export async function seedIfEmpty(sql) {
  const coursesCount = await sql`SELECT COUNT(*)::int AS count FROM courses;`;
  if ((coursesCount?.[0]?.count ?? 0) === 0) {
    for (const c of defaultCourses) {
      await sql`
        INSERT INTO courses (
          id,
          name,
          slug,
          description,
          instructor,
          instructor_bio,
          level,
          duration,
          price,
          category,
          rating,
          students_enrolled,
          featured_image,
          featured,
          is_external,
          external_url,
          modules,
          learning_outcomes
        )
        VALUES (
          ${c.id},
          ${c.name},
          ${c.slug || slugify(c.name)},
          ${c.description || null},
          ${c.instructor || null},
          ${c.instructorBio || null},
          ${c.level || null},
          ${c.duration || null},
          ${c.price || null},
          ${c.category || null},
          ${typeof c.rating === 'number' ? c.rating : null},
          ${c.studentsEnrolled !== undefined && c.studentsEnrolled !== null ? String(c.studentsEnrolled) : null},
          ${c.featuredImage || null},
          ${Boolean(c.featured)},
          ${Boolean(c.isExternal)},
          ${c.externalUrl || null},
          ${c.modules ? JSON.stringify(c.modules) : null},
          ${c.learningOutcomes ? JSON.stringify(c.learningOutcomes) : null}
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    }
  }

  // Correct the original placeholder catalog row without overwriting a course
  // that an administrator has since replaced.
  const systemDesignCourse = defaultCourses.find((course) => course.id === 9);
  if (systemDesignCourse) {
    await sql`
      UPDATE courses
      SET
        name = ${systemDesignCourse.name},
        slug = ${systemDesignCourse.slug},
        description = ${systemDesignCourse.description},
        instructor = ${systemDesignCourse.instructor},
        instructor_bio = ${systemDesignCourse.instructorBio},
        level = ${systemDesignCourse.level},
        duration = ${systemDesignCourse.duration},
        price = ${systemDesignCourse.price},
        category = ${systemDesignCourse.category},
        rating = ${systemDesignCourse.rating},
        students_enrolled = ${String(systemDesignCourse.studentsEnrolled)},
        featured_image = ${systemDesignCourse.featuredImage},
        featured = ${Boolean(systemDesignCourse.featured)},
        is_external = ${Boolean(systemDesignCourse.isExternal)},
        external_url = ${systemDesignCourse.externalUrl},
        modules = ${JSON.stringify(systemDesignCourse.modules)},
        learning_outcomes = ${JSON.stringify(systemDesignCourse.learningOutcomes)},
        updated_at = NOW()
      WHERE id = 9
        AND (
          name = 'System Design Fundamental'
          OR students_enrolled = '50K+'
          OR duration = 'Self-paced (Udemy)'
        );
    `;
  }

  // Backfill: any rows still missing a slug (e.g. existing prod rows from
  // before this migration) get one derived from name. We do this row-by-row
  // because each slug must be unique; on a collision we suffix the id.
  const missingSlugRows = await sql`
    SELECT id, name FROM courses WHERE slug IS NULL OR slug = '';
  `;
  for (const row of missingSlugRows || []) {
    const base = slugify(row.name);
    if (!base) continue;
    // Try the bare slug; if a collision exists (different course), append id.
    const collision = await sql`
      SELECT 1 FROM courses WHERE slug = ${base} AND id <> ${row.id} LIMIT 1;
    `;
    const finalSlug = collision?.length ? `${base}-${row.id}` : base;
    await sql`UPDATE courses SET slug = ${finalSlug} WHERE id = ${row.id};`;
  }

  const postsCount = await sql`SELECT COUNT(*)::int AS count FROM blog_posts;`;
  if ((postsCount?.[0]?.count ?? 0) === 0) {
    for (const p of seededBlogPosts) {
      await sql`
        INSERT INTO blog_posts (
          id,
          slug,
          title,
          description,
          content,
          author,
          date,
          category,
          read_time,
          featured_image,
          featured,
          series,
          series_order
        )
        VALUES (
          ${p.id},
          ${p.slug || null},
          ${p.title},
          ${p.description || null},
          ${p.content || null},
          ${p.author || null},
          ${p.date || null},
          ${p.category || null},
          ${p.readTime || null},
          ${p.featuredImage || null},
          ${Boolean(p.featured)},
          ${p.series || null},
          ${typeof p.order === 'number' ? p.order : null}
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    }
  }

  // Publish the reviewed System Design editorial queue idempotently. New slugs
  // are inserted on deploy; existing rows are left untouched so admin edits are
  // never overwritten by a later cold start.
  for (const p of seededBlogPosts.filter(
    (post) => post.category === 'System Design' && Number(post.order) >= 10
  )) {
    await sql`
      INSERT INTO blog_posts (
        slug,
        title,
        description,
        content,
        author,
        date,
        category,
        read_time,
        featured_image,
        featured,
        series,
        series_order
      )
      VALUES (
        ${p.slug},
        ${p.title},
        ${p.description || null},
        ${p.content || null},
        ${p.author || null},
        ${p.date || null},
        ${p.category || null},
        ${p.readTime || null},
        ${p.featuredImage || null},
        ${Boolean(p.featured)},
        ${p.series || null},
        ${typeof p.order === 'number' ? p.order : null}
      )
      ON CONFLICT (slug) DO NOTHING;
    `;
  }

  // Ensure sequences are aligned even after explicit-id seeding.
  // Without this, subsequent inserts can reuse an existing id and violate the pkey.
  await sql`
    SELECT setval(
      pg_get_serial_sequence('courses', 'id'),
      COALESCE((SELECT MAX(id) FROM courses), 0),
      true
    );
  `;
  await sql`
    SELECT setval(
      pg_get_serial_sequence('blog_posts', 'id'),
      COALESCE((SELECT MAX(id) FROM blog_posts), 0),
      true
    );
  `;

  // Site settings: insert any missing keys from the defaults list.
  // We use ON CONFLICT DO NOTHING so existing values entered via the admin
  // panel are preserved across deploys.
  for (const s of defaultSiteSettings) {
    await sql`
      INSERT INTO site_settings (key, value, category, type, label, description, sort_order)
      VALUES (
        ${s.key},
        ${s.value === undefined ? null : JSON.stringify(s.value)},
        ${s.category || 'general'},
        ${s.type || 'text'},
        ${s.label || null},
        ${s.description || null},
        ${typeof s.sortOrder === 'number' ? s.sortOrder : 0}
      )
      ON CONFLICT (key) DO NOTHING;
    `;
  }

  // Migrate only the generic defaults originally shipped with the site.
  // Custom values entered in the admin remain untouched.
  const focusedDefaults = [
    ['home.hero.badge', 'Learn. Build. Grow.', 'System Design, made practical'],
    ['home.hero.title.line1', 'Courses &', 'Understand System Design.'],
    ['home.hero.title.line2', 'Tech Blog', 'Explain it with confidence.'],
    [
      'home.hero.subtitle',
      'Explore courses and blog posts on web development, design, data science, and system design—written for real-world learning and interview prep.',
      'Build strong fundamentals with a clear tutorial path, practical architecture case studies, and an interview-focused course.'
    ],
    ['home.hero.cta_primary.label', 'View Courses', 'Start with free tutorials'],
    ['home.hero.cta_primary.path', '/courses', '/blog'],
    ['home.hero.cta_secondary.label', 'View Blog', 'Explore the course'],
    ['home.hero.cta_secondary.path', '/blog', '/courses'],
    ['home.feature.blog.title', 'Insightful Blog Posts', 'Learn one concept at a time'],
    [
      'home.feature.blog.description',
      'Stay updated with the latest trends, tutorials, and best practices in technology and design. Our insightful blog posts cover cutting-edge topics in web development, UI/UX design, and data science to help you stay ahead in your career.',
      'Follow the free System Design tutorial series from latency and throughput through databases, caching, and complete case studies.'
    ],
    ['home.feature.courses.title', 'Curated Courses', 'Learn with a guided course'],
    [
      'home.feature.courses.description',
      'Learn with structured courses across Web Development, Design, Data Science, and System Design—built to help you ship projects and level up fast.',
      'Use a structured curriculum when you want a focused path, practical explanations, and preparation you can revisit before interviews.'
    ]
  ];
  for (const [key, legacyValue, nextValue] of focusedDefaults) {
    await sql`
      UPDATE site_settings
      SET value = ${JSON.stringify(nextValue)}, updated_at = NOW()
      WHERE key = ${key} AND value = ${JSON.stringify(legacyValue)};
    `;
  }
}

// Guard against re-running schema + seed on every request. Vercel's serverless
// runtime keeps modules warm across invocations, so a single boolean per
// process saves us 20+ round trips on hot lambdas. On a fresh cold start the
// flag resets and we run once.
let schemaReadyPromise = null;

export async function ensureSchemaAndSeed() {
  const sql = getSqlClient();
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      try {
        await ensureSchema(sql);
        await seedIfEmpty(sql);
      } catch (e) {
        // Reset on failure so the next request can retry instead of being
        // permanently broken by a single transient error.
        schemaReadyPromise = null;
        throw e;
      }
    })();
  }
  await schemaReadyPromise;
  return sql;
}

export function toCourseDto(row) {
  if (!row) return null;
  // Always produce a slug — if the column is somehow null we derive one from
  // the name so the frontend never receives a course it can't link to.
  const slug = row.slug || slugify(row.name) || String(row.id);
  return {
    id: Number(row.id),
    slug,
    name: row.name,
    description: row.description,
    instructor: row.instructor,
    instructorBio: row.instructor_bio,
    level: row.level,
    duration: row.duration,
    price: row.price,
    category: row.category,
    rating: row.rating !== null && row.rating !== undefined ? Number(row.rating) : null,
    studentsEnrolled: row.students_enrolled,
    featuredImage: row.featured_image,
    featured: Boolean(row.featured),
    isExternal: Boolean(row.is_external),
    externalUrl: row.external_url,
    modules: row.modules || [],
    learningOutcomes: row.learning_outcomes || [],
  };
}

export function toSiteSettingDto(row) {
  if (!row) return null;
  return {
    key: row.key,
    value: row.value === null || row.value === undefined ? null : row.value,
    category: row.category || 'general',
    type: row.type || 'text',
    label: row.label || null,
    description: row.description || null,
    sortOrder: row.sort_order !== null && row.sort_order !== undefined ? Number(row.sort_order) : 0,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  };
}

export function settingsRowsToMap(rows) {
  const out = {};
  for (const r of rows || []) {
    out[r.key] = r.value === null || r.value === undefined ? null : r.value;
  }
  return out;
}

export function toBlogPostDto(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    description: row.description,
    content: row.content,
    author: row.author,
    date: row.date ? String(row.date) : null,
    category: row.category,
    readTime: row.read_time,
    featuredImage: row.featured_image,
    featured: Boolean(row.featured),
    series: row.series,
    order: row.series_order !== null && row.series_order !== undefined ? Number(row.series_order) : undefined,
  };
}
