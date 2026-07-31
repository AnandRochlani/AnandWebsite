/**
 * Safety net. Two layers:
 *   1. Synthetic fixtures that pin down the "never link inside X" rules.
 *   2. A real round-trip over every post: apply the proposed insertions in
 *      memory and assert the visible text is byte-identical and the anchors
 *      are balanced. Nothing is written by this module.
 */
import { scanRegions, findPhraseMatches, textOnly, verifyRewrite } from './html.mjs';
import { rewriteContent } from './opportunities.mjs';

function matchCount(html, phrase) {
  const { regions } = scanRegions(html);
  return findPhraseMatches(html, regions, phrase).length;
}

const FIXTURES = [
  {
    name: 'links inside a paragraph',
    html: '<p>We use consistent hashing here.</p>',
    phrase: 'consistent hashing',
    expect: 1,
  },
  {
    name: 'never inside an existing anchor',
    html: '<p>See <a href="/blog/x">consistent hashing</a> for more.</p>',
    phrase: 'consistent hashing',
    expect: 0,
  },
  {
    name: 'never inside a heading',
    html: '<h2>Consistent Hashing Explained</h2><p>ok</p>',
    phrase: 'consistent hashing',
    expect: 0,
  },
  {
    name: 'never inside code',
    html: '<p><code>consistent hashing</code> ring</p>',
    phrase: 'consistent hashing',
    expect: 0,
  },
  {
    name: 'never inside pre',
    html: '<pre>consistent hashing</pre>',
    phrase: 'consistent hashing',
    expect: 0,
  },
  {
    name: 'never inside an attribute value',
    html: '<p><img src="x.png" alt="consistent hashing diagram"> text</p>',
    phrase: 'consistent hashing',
    expect: 0,
  },
  {
    name: 'never in bare text outside a text host',
    html: '<div>consistent hashing</div>',
    phrase: 'consistent hashing',
    expect: 0,
  },
  {
    name: 'matches inside inline emphasis within a paragraph',
    html: '<p>The <strong>hash ring</strong> is circular.</p>',
    phrase: 'hash ring',
    expect: 1,
  },
  {
    name: 'plural tolerance on the final word',
    html: '<p>We add virtual nodes to the ring.</p>',
    phrase: 'virtual node',
    expect: 1,
  },
  {
    name: 'hyphen/space tolerance',
    html: '<p>Use fan-out on write here.</p>',
    phrase: 'fan out on write',
    expect: 1,
  },
  {
    name: 'word boundaries are hard',
    html: '<p>The cached caching cacheable value.</p>',
    phrase: 'cache',
    expect: 0,
  },
  {
    name: 'comments are ignored',
    html: '<!-- consistent hashing --><p>ok</p>',
    phrase: 'consistent hashing',
    expect: 0,
  },
  {
    name: 'list items are linkable',
    html: '<ul><li>Replication lag matters.</li></ul>',
    phrase: 'replication lag',
    expect: 1,
  },
  {
    name: 'nested protected tag resumes correctly',
    html: '<p>a <code>load balancer</code> b load balancer c</p>',
    phrase: 'load balancer',
    expect: 1,
  },
  {
    name: 'unclosed anchor does not swallow the document',
    html: '<p><a href="/x">link</a> load balancer here</p>',
    phrase: 'load balancer',
    expect: 1,
  },
];

export function runFixtures() {
  const failures = [];
  for (const f of FIXTURES) {
    const got = matchCount(f.html, f.phrase);
    if (got !== f.expect) failures.push(`${f.name}: expected ${f.expect} match(es), got ${got}`);
  }

  // Rewrite integrity on a fixture with several insertions.
  const html =
    '<p>Start with load balancing, then caching strategies, then sharding.</p>' +
    '<h2>load balancing</h2><p><code>sharding</code> and more caching strategies.</p>';
  const { regions } = scanRegions(html);
  const ins = [];
  for (const [phrase, href] of [
    ['load balancing', '/blog/a'],
    ['caching strategies', '/blog/b'],
    ['sharding', '/blog/c'],
  ]) {
    const m = findPhraseMatches(html, regions, phrase)[0];
    if (m) ins.push({ htmlStart: m.start, htmlEnd: m.end, targetUrl: href });
  }
  const out = rewriteContent(html, ins);
  const v = verifyRewrite(html, out, ins.length);
  if (!v.ok) failures.push(`rewrite fixture: ${v.errors.join(', ')}`);
  if (textOnly(html) !== textOnly(out)) failures.push('rewrite fixture: visible text changed');
  if (/<a[^>]*><a/.test(out)) failures.push('rewrite fixture: nested anchors');

  return { ok: failures.length === 0, failures, total: FIXTURES.length + 1 };
}

/** Round-trip every planned rewrite in memory. */
export function roundTrip(plans, postsBySlug) {
  const results = [];
  for (const plan of plans) {
    if (!plan.insertions.length) continue;
    const post = postsBySlug.get(plan.slug);
    const before = post.content;
    let after;
    let errors = [];
    try {
      after = rewriteContent(before, plan.insertions);
    } catch (e) {
      results.push({ slug: plan.slug, ok: false, errors: [`rewrite threw: ${e.message}`] });
      continue;
    }
    const v = verifyRewrite(before, after, plan.insertions.length);
    errors = v.errors;

    // every proposed href must now be present exactly once more than before
    for (const ins of plan.insertions) {
      const needle = `href="${ins.targetUrl}"`;
      const b = before.split(needle).length - 1;
      const a = after.split(needle).length - 1;
      if (a !== b + 1) errors.push(`href ${ins.targetUrl}: ${b} → ${a} (expected +1)`);
    }
    // the rewritten anchors must be detectable and non-nested
    if (/<a\b[^>]*>[^<]*<a\b/i.test(after)) errors.push('nested anchor detected');

    results.push({
      slug: plan.slug,
      ok: errors.length === 0,
      errors,
      textBefore: v.textBefore,
      textAfter: v.textAfter,
      inserted: plan.insertions.length,
      bytesBefore: before.length,
      bytesAfter: after.length,
      after,
    });
  }
  return { ok: results.every((r) => r.ok), results };
}
