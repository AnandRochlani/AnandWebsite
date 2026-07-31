// Battery test for the site_settings validators. No DB needed.
// Run: node tools/test-validators.mjs

import {
  validateValueForType,
  validateKeyValue,
  payloadByteLength,
  MAX_VALUE_BYTES,
} from '../api/_settingsValidators.js';

let passed = 0;
let failed = 0;

function assertNull(label, actual) {
  if (actual === null) {
    passed++;
    console.log('PASS', label);
  } else {
    failed++;
    console.log('FAIL', label, '→ expected null, got:', JSON.stringify(actual));
  }
}
function assertNonNull(label, actual) {
  if (actual !== null) {
    passed++;
    console.log('PASS', label, '→', actual);
  } else {
    failed++;
    console.log('FAIL', label, '→ expected an error, got null');
  }
}

console.log('\n── validateValueForType ───────────────────────────────────────');
assertNull('text accepts string',           validateValueForType('hi', 'text'));
assertNonNull('text rejects number',        validateValueForType(42, 'text'));
assertNonNull('text rejects huge string',   validateValueForType('x'.repeat(8001), 'text'));
assertNull('boolean accepts true',          validateValueForType(true, 'boolean'));
assertNonNull('boolean rejects "true"',     validateValueForType('true', 'boolean'));
assertNonNull('url rejects javascript:',    validateValueForType('javascript:alert(1)', 'url'));
assertNonNull('url rejects vbscript:',      validateValueForType('vbscript:msgbox', 'url'));
assertNonNull('url rejects data:',          validateValueForType('data:text/html,a', 'url'));
assertNonNull('url rejects //evil.com',     validateValueForType('//evil.com', 'url'));
assertNull('url accepts https',             validateValueForType('https://x', 'url'));
assertNull('url accepts mailto',            validateValueForType('mailto:a@b', 'url'));
assertNull('url accepts /relative',         validateValueForType('/relative', 'url'));
assertNonNull('image_url rejects ftp',      validateValueForType('ftp://x', 'image_url'));
assertNull('image_url accepts empty',       validateValueForType('', 'image_url'));
assertNull('json accepts arrays',           validateValueForType([1,2], 'json'));
assertNull('json accepts objects',          validateValueForType({a:1}, 'json'));
assertNull('json accepts null',             validateValueForType(null, 'json'));

console.log('\n── validateKeyValue (per-key) ─────────────────────────────────');
// social.links battery
assertNull('social.links accepts default',
  validateKeyValue('social.links', [
    { icon: 'Mail', href: 'mailto:a@b', label: 'Email', external: false },
    { icon: 'Github', href: 'https://github.com/x', label: 'GH', external: true },
    { icon: 'Mail', href: '#', label: 'Empty' },
  ]));
assertNonNull('social.links rejects javascript: href',
  validateKeyValue('social.links', [
    { icon: 'Mail', href: 'javascript:alert(1)', label: 'x' },
  ]));
assertNonNull('social.links rejects //evil.com href',
  validateKeyValue('social.links', [
    { icon: 'Mail', href: '//evil.com', label: 'x' },
  ]));
assertNonNull('social.links rejects non-array',
  validateKeyValue('social.links', { not: 'array' }));
assertNonNull('social.links rejects missing icon',
  validateKeyValue('social.links', [{ href: '#', label: 'x' }]));
assertNonNull('social.links rejects external as string',
  validateKeyValue('social.links', [
    { icon: 'Mail', href: '#', label: 'x', external: 'yes' },
  ]));

// footer.quick_links battery
assertNull('footer.quick_links accepts default',
  validateKeyValue('footer.quick_links', [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
  ]));
assertNonNull('footer.quick_links rejects javascript: path',
  validateKeyValue('footer.quick_links', [
    { name: 'Bad', path: 'javascript:alert(1)' },
  ]));
assertNonNull('footer.quick_links rejects //evil.com path',
  validateKeyValue('footer.quick_links', [
    { name: 'Bad', path: '//evil.com' },
  ]));
assertNonNull('footer.quick_links rejects empty name',
  validateKeyValue('footer.quick_links', [{ name: '   ', path: '/' }]));
assertNonNull('footer.quick_links rejects missing path',
  validateKeyValue('footer.quick_links', [{ name: 'X' }]));

// Generic *.path validator (covers hero CTAs)
assertNull('home.hero.cta_primary.path accepts /courses',
  validateKeyValue('home.hero.cta_primary.path', '/courses'));
assertNonNull('home.hero.cta_primary.path rejects javascript:',
  validateKeyValue('home.hero.cta_primary.path', 'javascript:alert(1)'));
assertNonNull('home.hero.cta_secondary.path rejects //evil',
  validateKeyValue('home.hero.cta_secondary.path', '//evil.com'));

// Keys without specific tightening should pass through.
assertNull('home.hero.title.line1 has no per-key check',
  validateKeyValue('home.hero.title.line1', 'whatever'));

console.log('\n── payloadByteLength ──────────────────────────────────────────');
const oversized = { blob: 'x'.repeat(MAX_VALUE_BYTES + 100) };
const ok = payloadByteLength(oversized) > MAX_VALUE_BYTES;
if (ok) { passed++; console.log('PASS oversized payload exceeds cap'); }
else    { failed++; console.log('FAIL oversized payload did not exceed cap'); }

const small = { x: 1 };
const okSmall = payloadByteLength(small) <= MAX_VALUE_BYTES;
if (okSmall) { passed++; console.log('PASS small payload within cap'); }
else         { failed++; console.log('FAIL small payload was reported oversized'); }

console.log('\n──────────────────────────────────────────────');
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
