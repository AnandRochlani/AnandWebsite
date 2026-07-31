import { slugify, isNumericString } from '@/lib/slug.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : null;
  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

// Make sure every course has a slug, even when coming from the local dev
// fallback (the bundled defaults may not have one).
function ensureCourseSlug(course) {
  if (!course) return course;
  if (course.slug) return course;
  const derived = slugify(course.name);
  return derived ? { ...course, slug: derived } : course;
}

export async function fetchCourses() {
  try {
    const data = await jsonFetch('/api/public/courses');
    return (data.courses || []).map(ensureCourseSlug);
  } catch (e) {
    // Local dev fallback (when /api isn't available under Vite dev server)
    try {
      const mod = await import('./courses.js');
      const list = typeof mod.getAllCourses === 'function' ? mod.getAllCourses() : [];
      return list.map(ensureCourseSlug);
    } catch (e2) {
      return [];
    }
  }
}

export async function fetchCourseBySlug(slug) {
  const value = String(slug || '');
  if (!value) return null;
  // If a numeric id leaks through (e.g. an old saved-courses cookie), fall
  // back to the id-based lookup. The public URL still uses slug only.
  const queryString = isNumericString(value)
    ? `id=${encodeURIComponent(value)}`
    : `slug=${encodeURIComponent(value)}`;
  try {
    const data = await jsonFetch(`/api/public/courses?${queryString}`);
    return ensureCourseSlug(data.course || null);
  } catch (e) {
    // Local dev fallback
    try {
      const mod = await import('./courses.js');
      const all = typeof mod.getAllCourses === 'function' ? mod.getAllCourses() : [];
      const match = isNumericString(value)
        ? all.find((c) => Number(c.id) === Number(value))
        : all.find((c) => (c.slug || slugify(c.name)) === value.toLowerCase());
      return ensureCourseSlug(match || null);
    } catch (e2) {
      return null;
    }
  }
}

// Public helper: accept either a slug or legacy numeric id.
// Frontend routes should use slugs; numeric ids are supported for old links only.
export async function fetchCourseBySlugOrId(slugOrId) {
  return fetchCourseBySlug(slugOrId);
}

// Kept for admin tooling (the admin panel still works with numeric ids).
export async function fetchCourseById(id) {
  try {
    const data = await jsonFetch(`/api/public/courses?id=${encodeURIComponent(id)}`);
    return ensureCourseSlug(data.course || null);
  } catch (e) {
    try {
      const mod = await import('./courses.js');
      const all = typeof mod.getAllCourses === 'function' ? mod.getAllCourses() : [];
      return ensureCourseSlug(all.find((c) => Number(c.id) === Number(id)) || null);
    } catch (e2) {
      return null;
    }
  }
}

export async function fetchBlogPosts() {
  try {
    const data = await jsonFetch('/api/public/blog-posts');
    return data.posts || [];
  } catch (e) {
    // Local dev fallback
    try {
      const mod = await import('./blogPosts.js');
      return typeof mod.getAllBlogPosts === 'function' ? mod.getAllBlogPosts() : [];
    } catch (e2) {
      return [];
    }
  }
}

export async function fetchBlogPostBySlugOrId(slugOrId) {
  const value = String(slugOrId || '');
  if (!value) return null;
  const isNumeric = /^[0-9]+$/.test(value);
  const qs = isNumeric ? `id=${encodeURIComponent(value)}` : `slug=${encodeURIComponent(value)}`;
  try {
    const data = await jsonFetch(`/api/public/blog-posts?${qs}`);
    return data.post || null;
  } catch (e) {
    // Local dev fallback
    try {
      const mod = await import('./blogPosts.js');
      const all = typeof mod.getAllBlogPosts === 'function' ? mod.getAllBlogPosts() : [];
      if (isNumeric) return all.find((p) => Number(p.id) === Number(value)) || null;
      return all.find((p) => p.slug === value) || null;
    } catch (e2) {
      return null;
    }
  }
}

// Admin (requires admin session cookie)
export async function adminCreateOrUpdateCourse({ id, payload }) {
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/admin/courses?id=${encodeURIComponent(id)}` : '/api/admin/courses';
  const data = await jsonFetch(url, {
    method,
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return data.course;
}

export async function adminDeleteCourse(id) {
  await jsonFetch(`/api/admin/courses?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

export async function adminCreateOrUpdateBlogPost({ id, payload }) {
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/admin/blog-posts?id=${encodeURIComponent(id)}` : '/api/admin/blog-posts';
  const data = await jsonFetch(url, {
    method,
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return data.post;
}

export async function adminDeleteBlogPost(id) {
  await jsonFetch(`/api/admin/blog-posts?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

export async function adminUpdateBlogOrder(blogOrderList) {
  await jsonFetch('/api/admin/blog-order', {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(blogOrderList),
  });
}

// ── Site settings ────────────────────────────────────────────────────────

export async function fetchSiteSettings() {
  try {
    const data = await jsonFetch('/api/public/settings');
    return data?.settings || {};
  } catch (e) {
    // Local dev fallback — use the bundled defaults so the site still renders.
    try {
      const mod = await import('./siteSettings.js');
      return typeof mod.getDefaultSettingsMap === 'function' ? mod.getDefaultSettingsMap() : {};
    } catch (e2) {
      return {};
    }
  }
}

export async function adminFetchSiteSettings() {
  const data = await jsonFetch('/api/admin/settings', { credentials: 'include' });
  return Array.isArray(data?.settings) ? data.settings : [];
}

export async function adminUpdateSiteSettings(updates) {
  const data = await jsonFetch('/api/admin/settings', {
    method: 'PUT',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify({ updates }),
  });
  return Array.isArray(data?.settings) ? data.settings : [];
}

