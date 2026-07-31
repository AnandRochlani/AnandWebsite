// URL / path sanitization for values that flow from the database into
// `<a href>` or React Router `<Link to>`.
//
// We deliberately keep this small and conservative:
//   - Relative paths starting with "/" or "#" are passed through.
//   - Absolute URLs are accepted only if their protocol is in the allowlist.
//   - Anything else (including "javascript:", "data:", "vbscript:", and
//     malformed input) collapses to "#" so the link is inert.

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Sanitize a value intended for an anchor `href`.
 *
 * @param {unknown} url
 * @param {string} [fallback="#"]
 */
export function sanitizeHref(url, fallback = '#') {
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Reject protocol-relative URLs ("//evil.com/x") — browsers resolve those
  // to the current page protocol, which is effectively an absolute URL with
  // no protocol check. Must come BEFORE the "/"-prefix shortcut.
  if (trimmed.startsWith('//')) return fallback;

  // Same-page anchor or same-origin path — always safe.
  if (trimmed.startsWith('#')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;

  // Absolute URL with explicit protocol — accept only the allowlist.
  try {
    const parsed = new URL(trimmed);
    if (ALLOWED_PROTOCOLS.has(parsed.protocol)) return trimmed;
  } catch (_) {
    // not a parseable absolute URL
  }
  return fallback;
}

/**
 * Sanitize a value intended for React Router `<Link to>`.
 * Only same-origin paths are allowed; anything else collapses to `/`.
 *
 * @param {unknown} path
 * @param {string} [fallback="/"]
 */
export function sanitizePath(path, fallback = '/') {
  if (typeof path !== 'string') return fallback;
  const trimmed = path.trim();
  if (!trimmed) return fallback;
  // "//evil.com" is treated as a host-relative URL by routers and browsers.
  if (trimmed.startsWith('//')) return fallback;
  if (trimmed.startsWith('/')) return trimmed;
  if (trimmed.startsWith('#')) return trimmed;
  return fallback;
}

/**
 * True if `url` is acceptable for an `href`. Used by server-side validators.
 */
export function isSafeHref(url) {
  return sanitizeHref(url, null) !== null;
}

/**
 * True if `path` is acceptable for a router path. Used by server-side validators.
 */
export function isSafePath(path) {
  return sanitizePath(path, null) !== null;
}
