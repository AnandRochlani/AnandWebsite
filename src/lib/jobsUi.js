export function formatExperience(job) {
  const min = job?.min_experience;
  const max = job?.max_experience;
  if (min != null && max != null) return `${min}–${max} years`;
  if (min != null) return `${min}+ years`;
  if (max != null) return `Up to ${max} years`;
  return null;
}

export function companyInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** @param {string} [skillsParam] comma-separated from URL */
export function parseSkillsParam(skillsParam) {
  if (!skillsParam || typeof skillsParam !== 'string') return [];
  return skillsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function skillsToUrlParam(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  return arr.map((s) => String(s).trim()).filter(Boolean).join(',');
}
