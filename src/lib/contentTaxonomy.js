/**
 * The site's indexable content clusters.
 *
 * Everything crawlable on anandrochlani.com belongs to one of these categories.
 * Anything else (legacy template posts, imported filler) stays out of the blog
 * listing, the sitemap, the prerenderer and the public API ordering, and is
 * served `noindex` — that exclusion is deliberate and predates this file.
 *
 * Adding a cluster here is the ONLY switch needed to make a new topic
 * crawlable; every consumer reads from this list.
 */
export const CONTENT_CLUSTERS = [
  {
    category: 'System Design',
    series: 'System Design Tutorial',
    /** Ordered series: prev/next navigation is driven by `order`. */
    ordered: true,
    priority: '0.8',
  },
  {
    category: 'Coding Interview',
    series: 'Coding Interview Patterns',
    ordered: true,
    priority: '0.8',
  },
];

export const INDEXABLE_CATEGORIES = CONTENT_CLUSTERS.map((c) => c.category);
export const INDEXABLE_SERIES = CONTENT_CLUSTERS.map((c) => c.series);

/** True when a post belongs to a crawlable cluster. */
export function isIndexableCategory(category) {
  return INDEXABLE_CATEGORIES.includes(category);
}

export function isIndexablePost(post) {
  return Boolean(post) && isIndexableCategory(post.category);
}

/** Cluster config for a post, or undefined when it is not in a cluster. */
export function clusterFor(post) {
  if (!post) return undefined;
  return CONTENT_CLUSTERS.find(
    (c) => c.category === post.category || c.series === post.series
  );
}

/** Sitemap priority for a post. */
export function priorityFor(post) {
  return clusterFor(post)?.priority ?? '0.6';
}

/**
 * Sort comparator for a mixed list of posts: clusters keep their declared
 * order (System Design first), ordered series sort by `order`, everything
 * else falls back to newest-first.
 */
export function comparePosts(a, b) {
  const ai = INDEXABLE_CATEGORIES.indexOf(a.category);
  const bi = INDEXABLE_CATEGORIES.indexOf(b.category);
  const aRank = ai === -1 ? INDEXABLE_CATEGORIES.length : ai;
  const bRank = bi === -1 ? INDEXABLE_CATEGORIES.length : bi;
  if (aRank !== bRank) return aRank - bRank;
  if (aRank < INDEXABLE_CATEGORIES.length && CONTENT_CLUSTERS[aRank].ordered) {
    return (a.order ?? 999) - (b.order ?? 999);
  }
  return new Date(b.date || 0) - new Date(a.date || 0);
}
