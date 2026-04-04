import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'a',
  'div',
  'span',
  'blockquote',
  'hr',
  'sub',
  'sup',
];

const ALLOWED_ATTR = ['href', 'title', 'class', 'target', 'rel', 'id'];

let hooksInstalled = false;

function ensureSanitizeHooks() {
  if (hooksInstalled || typeof window === 'undefined') return;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName !== 'A') return;
    const href = node.getAttribute('href') || '';
    if (/^https?:\/\//i.test(href)) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
  hooksInstalled = true;
}

/** Decode basic HTML entities (e.g. raw_description from API). */
export function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  if (typeof document === 'undefined') return str;
  const t = document.createElement('textarea');
  t.innerHTML = str;
  return t.value;
}

/** HTML job copy often starts with a tag after optional whitespace. */
export function isLikelyHtml(s) {
  return typeof s === 'string' && /^\s*</.test(s);
}

/**
 * Resolve which text to show and whether to render it as HTML.
 * HTML may live in description or raw_description (check raw after entity decode).
 * If neither is HTML, use plain description; if that's empty, plain raw_decoded.
 *
 * @param {Record<string, unknown>} job
 * @returns {{ source: string, isHtml: boolean }}
 */
export function getJobDescriptionDisplay(job) {
  if (!job) return { source: '', isHtml: false };

  const desc = job.description != null ? String(job.description).trim() : '';
  const raw = job.raw_description != null ? String(job.raw_description).trim() : '';
  const rawDecoded = raw ? decodeHtmlEntities(raw) : '';

  if (desc && isLikelyHtml(desc)) {
    return { source: desc, isHtml: true };
  }
  if (rawDecoded && isLikelyHtml(rawDecoded)) {
    return { source: rawDecoded, isHtml: true };
  }
  if (desc) {
    return { source: desc, isHtml: false };
  }
  if (rawDecoded) {
    return { source: rawDecoded, isHtml: false };
  }
  return { source: '', isHtml: false };
}

/** Plain snippet for cards, meta description, etc. */
export function stripHtmlForPreview(s) {
  if (!s || typeof s !== 'string') return '';
  const decoded = decodeHtmlEntities(s);
  return decoded.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Sanitized HTML safe for dangerouslySetInnerHTML (client-only).
 * @param {string} html
 */
export function sanitizeJobHtml(html) {
  if (!html || typeof html !== 'string') return '';
  if (typeof window === 'undefined') return '';
  ensureSanitizeHooks();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
}
