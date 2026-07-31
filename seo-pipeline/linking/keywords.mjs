/**
 * Builds the keyword -> URL map that drives internal linking.
 *
 * Sources, highest confidence first:
 *   plan:primary    (1.00)  content-plan.json primaryKeyword
 *   seed            (0.90)  linking/keyword-seeds.json (hand-curated)
 *   manual          (0.95)  entries you add to keyword-map.json with "manual": true
 *   plan:secondary  (0.75)  content-plan.json secondaryKeywords
 *   title           (0.55)  derived from the post title
 *   slug            (0.40)  derived from the slug
 *
 * The result is persisted to linking/keyword-map.json so it is inspectable and
 * hand-editable. Regenerating preserves `blocklist`, per-post `exclude`, and any
 * keyword flagged `"manual": true`.
 */
import fs from 'node:fs';
import path from 'node:path';

export const WEIGHTS = {
  'plan:primary': 1.0,
  manual: 0.95,
  seed: 0.9,
  'plan:secondary': 0.75,
  title: 0.55,
  slug: 0.4,
};

/** Phrases too generic to ever be a useful anchor. Overridable in keyword-map.json. */
export const DEFAULT_BLOCKLIST = [
  'system design', 'system design interview', 'design interview', 'interview',
  'interview question', 'system design case study', 'case study', 'design',
  'architecture', 'system', 'systems', 'guide', 'explained', 'tutorial',
  'fundamentals', 'best practices', 'trade off', 'scale', 'performance',
];

/** Single words that are far too common in this corpus to link on. */
const GENERIC_WORDS = new Set([
  'design', 'system', 'systems', 'interview', 'scale', 'scaling', 'data', 'cache',
  'caching', 'database', 'databases', 'server', 'servers', 'service', 'services',
  'architecture', 'performance', 'storage', 'traffic', 'request', 'requests',
  'user', 'users', 'api', 'apis', 'network', 'memory', 'queue', 'index', 'key',
  'keys', 'read', 'reads', 'write', 'writes', 'node', 'nodes', 'client', 'clients',
]);

const LEAD_STRIP = new Set([
  'design', 'designing', 'understanding', 'mastering', 'building', 'getting',
  'started', 'introduction', 'intro', 'how', 'what', 'why', 'learn', 'the', 'a',
  'an', 'to', 'complete', 'your', 'my',
]);

const TAIL_STRIP = new Set([
  'explained', 'guide', 'tutorial', 'overview', 'edition', '2026', '2025', 'part',
  'basics', 'introduction', 'interview', 'questions', 'question', 'answers',
  'fundamentals', 'design', 'system', 'to', 'a', 'an', 'the', 'and', 'of', 'for',
  'beginners', 'beginner', 'study', 'case',
]);

const tokens = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, ' ')
    .split(/[\s]+/)
    .filter(Boolean);

/** "Design Facebook News Feed: System Design Interview Guide (2026)" -> "facebook news feed" */
export function phraseFromTitle(title) {
  let t = String(title || '')
    .replace(/\([^)]*\)/g, ' ')
    .split(':')[0]
    .split(/\s+like\s+|\s+using\s+|\s+with\s+/i)[0];
  let words = tokens(t);
  while (words.length && LEAD_STRIP.has(words[0])) words.shift();
  while (words.length && TAIL_STRIP.has(words[words.length - 1])) words.pop();
  return words.join(' ').trim();
}

/** "load-balancing-distributing-traffic-across-servers" -> "load balancing distributing traffic across servers" */
export function phraseFromSlug(slug) {
  let words = String(slug || '').split('-').filter(Boolean);
  while (words.length && LEAD_STRIP.has(words[0])) words.shift();
  while (words.length && TAIL_STRIP.has(words[words.length - 1])) words.pop();
  return words.join(' ').trim();
}

function acceptable(phrase, blocklist) {
  const p = phrase.trim().toLowerCase();
  if (!p) return false;
  if (blocklist.has(p)) return false;
  if (p.length < 4) return false;
  const words = p.split(/[\s-]+/);
  if (words.length > 5) return false;
  if (words.length === 1) {
    return p.length >= 5 && !GENERIC_WORDS.has(p);
  }
  // A multi-word phrase made only of generic words is still generic.
  if (words.every((w) => GENERIC_WORDS.has(w) || TAIL_STRIP.has(w))) return false;
  return true;
}

function loadSeeds(seedFile) {
  if (!fs.existsSync(seedFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(seedFile, 'utf8')).seeds || {};
  } catch {
    return {};
  }
}

/**
 * @param {object} opts
 * @param {Array} opts.posts merged post universe
 * @param {Map} opts.planBySlug content-plan queue entries by slug
 * @param {string} opts.mapFile path to keyword-map.json
 * @param {string} opts.seedFile path to keyword-seeds.json
 */
export function buildKeywordMap({ posts, planBySlug, mapFile, seedFile, write = true }) {
  const existing = fs.existsSync(mapFile)
    ? JSON.parse(fs.readFileSync(mapFile, 'utf8'))
    : {};
  const blocklist = new Set(
    (Array.isArray(existing.blocklist) ? existing.blocklist : DEFAULT_BLOCKLIST).map((s) =>
      s.toLowerCase()
    )
  );
  const seeds = loadSeeds(seedFile);
  const prevPosts = existing.posts || {};

  const out = { };
  const notes = { ambiguous: [], rejected: [] };

  for (const post of posts) {
    if (!post.linkable) continue;
    const prev = prevPosts[post.slug] || {};
    const exclude = new Set((prev.exclude || []).map((s) => s.toLowerCase()));
    const byPhrase = new Map();

    const add = (phrase, source, extra = {}) => {
      const p = String(phrase || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (!p) return;
      if (exclude.has(p)) return;
      if (!acceptable(p, blocklist)) {
        notes.rejected.push({ slug: post.slug, phrase: p, source });
        return;
      }
      const weight = extra.weight ?? WEIGHTS[source] ?? 0.5;
      const cur = byPhrase.get(p);
      if (!cur || weight > cur.weight) byPhrase.set(p, { phrase: p, weight, source, ...extra });
    };

    // 1. hand-written entries survive regeneration
    for (const k of prev.keywords || []) {
      if (k && k.manual) add(k.phrase, 'manual', { manual: true, weight: k.weight ?? WEIGHTS.manual });
    }
    // 2. content plan
    const q = planBySlug.get(post.slug);
    if (q) {
      add(q.primaryKeyword, 'plan:primary');
      for (const s of q.secondaryKeywords || []) add(s, 'plan:secondary');
    }
    // 3. curated seeds
    for (const s of seeds[post.slug] || []) add(s, 'seed');
    // 4. derived
    add(phraseFromTitle(post.title), 'title');
    const slugPhrase = phraseFromSlug(post.slug);
    if (slugPhrase.split(/\s+/).length <= 4) add(slugPhrase, 'slug');

    out[post.slug] = {
      url: post.url,
      title: post.title,
      order: post.order,
      status: post.source,
      editable: post.editable,
      exclude: [...exclude],
      keywords: [...byPhrase.values()].sort((a, b) => b.weight - a.weight || a.phrase.localeCompare(b.phrase)),
    };
  }

  // Ambiguity resolution: a phrase may only point at one post.
  const owners = new Map();
  for (const [slug, entry] of Object.entries(out)) {
    for (const k of entry.keywords) {
      const list = owners.get(k.phrase) || [];
      list.push({ slug, weight: k.weight });
      owners.set(k.phrase, list);
    }
  }
  for (const [phrase, list] of owners) {
    if (list.length < 2) continue;
    list.sort((a, b) => b.weight - a.weight);
    const winner = list[0].weight > list[1].weight ? list[0].slug : null;
    notes.ambiguous.push({ phrase, claimedBy: list.map((l) => l.slug), resolvedTo: winner });
    for (const l of list) {
      if (l.slug === winner) continue;
      out[l.slug].keywords = out[l.slug].keywords.filter((k) => k.phrase !== phrase);
    }
    if (!winner) {
      // nobody wins a tie — drop it everywhere
      for (const l of list) out[l.slug].keywords = out[l.slug].keywords.filter((k) => k.phrase !== phrase);
    }
  }

  const doc = {
    note:
      'Generated by seo-pipeline/internal-links.mjs — hand-editable. Regenerating preserves ' +
      '`blocklist`, each post\'s `exclude` list, and any keyword marked "manual": true. ' +
      'Add durable phrases to linking/keyword-seeds.json instead if you want them re-derived cleanly.',
    generatedAt: new Date().toISOString(),
    blocklist: [...blocklist].sort(),
    ambiguousPhrases: notes.ambiguous,
    posts: out,
  };

  if (write) {
    fs.mkdirSync(path.dirname(mapFile), { recursive: true });
    fs.writeFileSync(mapFile, `${JSON.stringify(doc, null, 2)}\n`);
  }
  return { doc, notes };
}
