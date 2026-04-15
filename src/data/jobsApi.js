async function jsonFetch(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : null;
  if (!res.ok) {
    const message = data?.error || data?.detail || `Request failed (${res.status})`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return data;
}

/**
 * @param {Record<string, unknown>} obj
 * @returns {URLSearchParams}
 */
export function buildJobsParams(obj) {
  const sp = new URLSearchParams();
  if (obj.q) sp.set('q', String(obj.q));
  if (obj.location) sp.set('location', String(obj.location));
  if (obj.company && !obj.company_id) sp.set('company', String(obj.company));
  if (obj.company_id != null && obj.company_id !== '') {
    sp.set('company_id', String(obj.company_id));
  }
  if (obj.min_exp != null && obj.min_exp !== '') {
    sp.set('min_exp', String(obj.min_exp));
  }
  if (obj.max_exp != null && obj.max_exp !== '') {
    sp.set('max_exp', String(obj.max_exp));
  }
  if (obj.page != null) sp.set('page', String(obj.page));
  if (obj.limit != null) sp.set('limit', String(obj.limit));
  const skills = obj.skills;
  if (Array.isArray(skills)) {
    skills
      .map((s) => String(s).trim())
      .filter(Boolean)
      .forEach((s) => sp.append('skills', s));
  }
  return sp;
}

export async function fetchJobs(obj) {
  const qs = buildJobsParams(obj).toString();
  const data = await jsonFetch(`/api/public/jobs?${qs}`);
  return {
    data: Array.isArray(data.data) ? data.data : [],
    total: Number(data.total) || 0,
    page: Number(data.page) || 1,
    limit: Number(data.limit) || 20,
  };
}

export async function fetchJobById(id) {
  const data = await jsonFetch(`/api/public/jobs/${encodeURIComponent(String(id))}`);
  if (data && data.id != null) return data;
  if (data && data.job) return data.job;
  return data;
}

export async function fetchCompanies(obj) {
  const sp = new URLSearchParams();
  if (obj.q) sp.set('q', String(obj.q));
  if (obj.page != null) sp.set('page', String(obj.page));
  if (obj.limit != null) sp.set('limit', String(obj.limit));
  const data = await jsonFetch(`/api/public/companies?${sp.toString()}`);
  return {
    data: Array.isArray(data.data) ? data.data : [],
    total: Number(data.total) || 0,
    page: Number(data.page) || 1,
    limit: Number(data.limit) || 20,
  };
}

export async function fetchCompanyById(id) {
  const data = await jsonFetch(`/api/public/companies/${encodeURIComponent(String(id))}`);
  if (data && data.id != null) return data;
  return data;
}
