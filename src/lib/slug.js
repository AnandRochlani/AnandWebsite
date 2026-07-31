// Shared slug helpers used by both the frontend and backend.
//
// The function is intentionally simple: lowercase, ASCII-fold the obvious
// characters, replace anything non-alphanumeric with a single dash, and trim
// dashes from the ends. It's good enough for course/blog titles which are
// always written by an admin (no untrusted input). If we ever need full
// Unicode support we can swap in a library — until then, no extra deps.

const COMBINING_MARK_RE = /[̀-ͯ]/g;

export function slugify(input) {
  if (input === null || input === undefined) return '';
  return String(input)
    .toLowerCase()
    .normalize('NFKD')
    // strip combining marks left over from NFKD (é → e)
    .replace(COMBINING_MARK_RE, '')
    // keep word chars and spaces/dashes; drop everything else
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Numeric strings are still valid identifiers but they shouldn't be treated
// as slugs by the lookup logic — the frontend uses this to decide whether to
// fall back to an id query.
export function isNumericString(value) {
  return typeof value === 'string' && /^[0-9]+$/.test(value);
}
