import { neon } from '@neondatabase/serverless';

import { defaultCourses } from '../src/data/courses.js';
import { blogPosts as seededBlogPosts } from '../src/data/blogPosts.js';

function getDatabaseUrl() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL;

  if (!url) {
    throw new Error(
      'Missing database connection string. Set DATABASE_URL (recommended) or POSTGRES_URL in Vercel env vars.'
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
}

export async function seedIfEmpty(sql) {
  const coursesCount = await sql`SELECT COUNT(*)::int AS count FROM courses;`;
  if ((coursesCount?.[0]?.count ?? 0) === 0) {
    for (const c of defaultCourses) {
      await sql`
        INSERT INTO courses (
          id,
          name,
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
}

export async function ensureSchemaAndSeed() {
  const sql = getSqlClient();
  await ensureSchema(sql);
  await seedIfEmpty(sql);
  return sql;
}

export function toCourseDto(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
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

