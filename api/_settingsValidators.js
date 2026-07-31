// Pure validators for site_settings writes.
//
// Pulled out of api/admin/settings.js so they can be unit-tested without a
// database. Imported by the admin endpoint AND by tests under tools/.

import { isSafeHref, isSafePath } from '../src/lib/safeUrl.js';

// Hard cap on a single setting's stringified payload, to prevent a runaway
// JSON blob from filling the table.
export const MAX_VALUE_BYTES = 64 * 1024; // 64 KB

export function isPlainObject(v) {
  return Object.prototype.toString.call(v) === '[object Object]';
}

/**
 * Validate that `value` is shape-compatible with `type`.
 * Returns null on success, or a string error otherwise.
 */
export function validateValueForType(value, type) {
  switch (type) {
    case 'text':
    case 'textarea':
      if (typeof value !== 'string') return 'Expected a string';
      if (value.length > 8000) return 'String too long (max 8000 chars)';
      return null;
    case 'url':
    case 'image_url':
      if (typeof value !== 'string') return 'Expected a URL string';
      if (value && !isSafeHref(value)) {
        return 'URL must be http(s), mailto:, tel:, or a relative path';
      }
      return null;
    case 'boolean':
      if (typeof value !== 'boolean') return 'Expected a boolean';
      return null;
    case 'json':
      // Anything JSON-serializable is fine here; per-key validators below
      // tighten this for known structured keys.
      return null;
    default:
      return null;
  }
}

/**
 * Per-key tightening. Any key whose value flows into `<a href>` or
 * `<Link to>` must be validated regardless of declared `type`.
 */
export function validateKeyValue(key, value) {
  if (key === 'footer.quick_links') {
    if (!Array.isArray(value)) return 'Expected an array';
    for (const [i, link] of value.entries()) {
      if (!isPlainObject(link)) return `Item ${i}: expected an object`;
      if (typeof link.name !== 'string' || !link.name.trim()) {
        return `Item ${i}: "name" must be a non-empty string`;
      }
      if (typeof link.path !== 'string' || !isSafePath(link.path)) {
        return `Item ${i}: "path" must be a relative path starting with "/"`;
      }
    }
    return null;
  }

  if (key === 'social.links') {
    if (!Array.isArray(value)) return 'Expected an array';
    for (const [i, s] of value.entries()) {
      if (!isPlainObject(s)) return `Item ${i}: expected an object`;
      if (typeof s.icon !== 'string') return `Item ${i}: "icon" must be a string`;
      if (typeof s.label !== 'string') return `Item ${i}: "label" must be a string`;
      if (typeof s.href !== 'string' || !isSafeHref(s.href)) {
        return `Item ${i}: "href" must be a safe URL (http/https/mailto/tel) or "#"`;
      }
      if (s.external !== undefined && typeof s.external !== 'boolean') {
        return `Item ${i}: "external" must be a boolean`;
      }
    }
    return null;
  }

  if (key.endsWith('.path') && typeof value === 'string' && !isSafePath(value)) {
    return 'Path must start with "/" or "#"';
  }

  return null;
}

export function payloadByteLength(value) {
  try {
    return Buffer.byteLength(JSON.stringify(value ?? null), 'utf8');
  } catch (_) {
    return Number.POSITIVE_INFINITY;
  }
}
