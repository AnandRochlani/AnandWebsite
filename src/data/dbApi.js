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

export async function fetchCourses() {
  try {
    const data = await jsonFetch('/api/public/courses');
    return data.courses || [];
  } catch (e) {
    // Local dev fallback (when /api isn't available under Vite dev server)
    try {
      const mod = await import('./courses.js');
      return typeof mod.getAllCourses === 'function' ? mod.getAllCourses() : [];
    } catch (e2) {
      return [];
    }
  }
}

export async function fetchCourseById(id) {
  try {
    const data = await jsonFetch(`/api/public/courses?id=${encodeURIComponent(id)}`);
    return data.course || null;
  } catch (e) {
    // Local dev fallback
    try {
      const mod = await import('./courses.js');
      const all = typeof mod.getAllCourses === 'function' ? mod.getAllCourses() : [];
      return all.find((c) => Number(c.id) === Number(id)) || null;
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

