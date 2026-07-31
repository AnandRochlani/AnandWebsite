import React, { useMemo, useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, Share2, Facebook, Twitter, Linkedin, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchBlogPostBySlugOrId, fetchBlogPosts } from '@/data/dbApi';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SEOHead from '@/components/SEOHead';
import { optimizeImageUrl, generateImageSrcset } from '@/lib/utils';
import { isIndexablePost } from '@/lib/contentTaxonomy';

const articleMetaDescription = (post) => {
  const description = String(post?.description || '').replace(/\s+/g, ' ').trim();
  if (description.length >= 70) return description;

  const excerpt = String(post?.content || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return `${description}${description && excerpt ? ' ' : ''}${excerpt}`.trim();
};

const BlogPostDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState(null);
  const [allBlogPosts, setAllBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const [p, list] = await Promise.all([
          fetchBlogPostBySlugOrId(slug),
          fetchBlogPosts(),
        ]);
        if (!mounted) return;
        setPost(p);
        setAllBlogPosts(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!mounted) return;
        setPost(null);
        setAllBlogPosts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [slug]);

  // Memoize related posts to prevent recalculation
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return allBlogPosts
      .filter(p => p.category === post.category && p.id !== post.id)
      .slice(0, 3);
  }, [allBlogPosts, post]);

  // Get all related posts for sidebar
  const sidebarPosts = useMemo(() => {
    if (!post) return [];
    
    // If it's part of a series, show all posts in that series
    if (post.series && post.order !== undefined) {
      return allBlogPosts
        .filter(p => p.series === post.series && p.order !== undefined)
        .sort((a, b) => a.order - b.order);
    }
    
    // Otherwise, show all posts in the same category
    return allBlogPosts
      .filter(p => p.category === post.category)
      .sort((a, b) => {
        // If posts have order, sort by order, otherwise by date
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return new Date(b.date) - new Date(a.date);
      });
  }, [allBlogPosts, post]);

  // The series list is a fixed-height scroll container. On a 25-part series a reader
  // opening Part 9 would otherwise see Parts 1-6 and have to hunt for their position,
  // which reads as the sidebar not tracking the article. Scroll the active item into
  // view inside the container only — never scroll the page itself.
  const seriesListRef = useRef(null);
  useLayoutEffect(() => {
    const container = seriesListRef.current;
    if (!container || !post) return;

    // Runs as a layout effect so the first attempt happens after the DOM is in place
    // but before paint — the reader never sees the list jump. The timed retries cover
    // the case where the panel has not been given its height yet (max-h is in vh
    // units, so clientHeight is 0 until layout settles); capped so a sidebar that
    // stays collapsed cannot retry forever.
    let cancelled = false;
    let attempts = 0;
    const place = () => {
      if (cancelled) return;
      const active = container.querySelector('[data-series-active="true"]');
      if (active && container.clientHeight) {
        const target = Math.max(
          0,
          active.offsetTop - container.clientHeight / 2 + active.clientHeight / 2
        );
        container.scrollTop = target;
        if (Math.abs(container.scrollTop - target) < 2) return;
      }
      if (attempts++ < 20) setTimeout(place, 50);
    };
    place();
    return () => {
      cancelled = true;
    };
  }, [post, sidebarPosts]);

  // Get previous and next posts for ordered series (System Design)
  const { previousPost, nextPost } = useMemo(() => {
    if (!post || !post.series || !post.order) {
      return { previousPost: null, nextPost: null };
    }

    // Get all posts in the same series, sorted by order
    const seriesPosts = allBlogPosts
      .filter(p => p.series === post.series && p.order !== undefined)
      .sort((a, b) => a.order - b.order);

    const currentIndex = seriesPosts.findIndex(p => p.id === post.id);
    
    return {
      previousPost: currentIndex > 0 ? seriesPosts[currentIndex - 1] : null,
      nextPost: currentIndex < seriesPosts.length - 1 ? seriesPosts[currentIndex + 1] : null
    };
  }, [allBlogPosts, post]);

  // Prefetch related post routes on mount
  useEffect(() => {
    if (relatedPosts.length > 0) {
      // Prefetch related post routes on idle
      const schedulePrefetch = (callback) => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(callback, { timeout: 2000 });
        } else {
          setTimeout(callback, 100);
        }
      };

      schedulePrefetch(() => {
        relatedPosts.forEach(relatedPost => {
          try {
            const route = `/blog/${relatedPost.slug || relatedPost.id}`;
            if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(`prefetched_${route}`)) {
              const link = document.createElement('link');
              link.rel = 'prefetch';
              link.href = route;
              link.as = 'document';
              document.head.appendChild(link);
              sessionStorage.setItem(`prefetched_${route}`, 'true');
            } else if (typeof sessionStorage === 'undefined') {
              const link = document.createElement('link');
              link.rel = 'prefetch';
              link.href = route;
              link.as = 'document';
              document.head.appendChild(link);
            }
          } catch (e) {
            // Silently fail for individual posts
          }
        });
      });
    }
  }, [relatedPosts]);

  const handleShare = (platform) => {
    toast({
      title: `Sharing on ${platform}`,
      description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  // Redirect numeric/legacy URLs to canonical slug URL
  const shouldRedirect = Boolean(post && slug && post.slug && slug !== post.slug);
  const isNotFound = !loading && !post;

  if (shouldRedirect) {
    return <Navigate to={`/blog/${post.slug}`} replace />;
  }

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <SEOHead
          title="Post Not Found"
          description="This article does not exist. Browse the full System Design Tutorial series instead."
          noindex
        />
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Post Not Found</h1>
          <Link to="/blog">
            <Button className="bg-brand hover:bg-brand-dark text-white font-semibold">
              View All Articles
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !post) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={post.title}
        description={articleMetaDescription(post)}
        image={post.featuredImage}
        keywords={`${post.title}, ${post.category}, system design tutorial, system design interview preparation`}
        canonical={`https://anandrochlani.com/blog/${post.slug}`}
        type="article"
        authorName={post.author}
        publishedTime={post.date}
        modifiedTime={post.updatedAt || post.updated_at || post.date}
        noindex={!isIndexablePost(post)}
      />

      <div className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar - Related Blogs */}
            {sidebarPosts.length > 1 && (
              <aside aria-label="Article series" className="lg:w-80 flex-shrink-0 order-2 lg:order-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="lg:sticky lg:top-24"
                >
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                      {post.series ? 'Continue the series' : `${post.category} Articles`}
                    </h3>
                    {post.series && <p className="mb-4 text-sm text-slate-500">{post.series}</p>}
                    <div ref={seriesListRef} className="space-y-2 max-h-[60vh] lg:max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                      {sidebarPosts.map((sidebarPost) => {
                        const isActive = sidebarPost.id === post.id;
                        return (
                          <Link
                            key={sidebarPost.id}
                            to={`/blog/${sidebarPost.slug || sidebarPost.id}`}
                            data-series-active={isActive ? 'true' : undefined}
                            aria-current={isActive ? 'page' : undefined}
                            className={`block p-3 rounded-lg transition-all duration-300 border-l-4 ${
                              isActive
                                ? 'bg-brand-soft border-l-brand'
                                : 'bg-white hover:bg-slate-50 border-l-transparent'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {sidebarPost.order && (
                                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isActive
                                    ? 'bg-brand text-white'
                                    : 'bg-brand-soft text-brand'
                                }`}>
                                  {sidebarPost.order}
                                </span>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-medium line-clamp-2 ${
                                  isActive ? 'text-brand' : 'text-slate-600 hover:text-brand'
                                } transition-colors`}>
                                  {sidebarPost.title}
                                </h4>
                                {sidebarPost.order && (
                                  <span className="text-xs text-slate-500 mt-1 block">
                                    Part {sidebarPost.order}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </aside>
            )}

            {/* Main Content */}
            <article className="min-w-0 flex-1 max-w-4xl order-1 lg:order-2">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Button
              onClick={() => navigate('/blog', { replace: true })}
              variant="outline"
              className="min-h-11 bg-white border-slate-300 text-slate-700 hover:border-brand hover:text-brand"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Articles
            </Button>
          </motion.div>

          {/* Post Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <span className="inline-block px-4 py-1 rounded-full bg-brand-soft text-brand text-sm font-semibold mb-4">
              {post.category}
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              {post.title}
            </h1>
            <p className="mb-6 max-w-3xl text-lg leading-relaxed text-slate-600">{post.description}</p>
            <div className="flex flex-wrap items-center gap-6 text-slate-500 mb-6">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(post.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {post.readTime}
              </span>
              <span>By {post.author}</span>
            </div>

            {/* Share Buttons */}
            <div className="hidden items-center space-x-2">
              <span className="text-slate-500 text-sm mr-2">Share:</span>
              <button
                onClick={() => handleShare('Facebook')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-brand-soft text-slate-500 hover:text-brand transition-all duration-300"
                aria-label="Share on Facebook"
              >
                <Facebook className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('Twitter')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-brand-soft text-slate-500 hover:text-brand transition-all duration-300"
                aria-label="Share on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('LinkedIn')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-brand-soft text-slate-500 hover:text-brand transition-all duration-300"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('Link')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-brand-soft text-slate-500 hover:text-brand transition-all duration-300"
                aria-label="Copy link"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Featured Image */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative h-56 sm:h-80 lg:h-96 rounded-2xl overflow-hidden mb-10 border border-slate-200 shadow-sm"
          >
            <img
              src={optimizeImageUrl(post.featuredImage, 600, 35)}
              srcSet={generateImageSrcset(post.featuredImage)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              alt={post.title}
              loading="eager"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Post Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="blog-content prose prose-slate prose-lg max-w-none mb-16"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Series Navigation - Previous/Next */}
          {post.series && (previousPost || nextPost) && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="border-t border-slate-200 pt-8 mb-12"
            >
              <div className="mb-4">
                <span className="text-sm text-brand font-semibold">{post.series}</span>
                <span className="text-sm text-slate-500 ml-2">Part {post.order}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Previous Post */}
                {previousPost ? (
                  <Link
                    to={`/blog/${previousPost.slug || previousPost.id}`}
                    className="group block p-6 rounded-xl bg-white border border-slate-300 hover:border-brand transition-all duration-300"
                  >
                    <div className="flex items-center text-brand text-sm font-medium mb-2">
                      <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                      Previous
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 group-hover:text-brand transition-colors line-clamp-2">
                      {previousPost.title}
                    </h3>
                    {previousPost.order && (
                      <span className="text-xs text-slate-500 mt-2 inline-block">Part {previousPost.order}</span>
                    )}
                  </Link>
                ) : (
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-400 text-sm">No previous post</div>
                  </div>
                )}

                {/* Next Post */}
                {nextPost ? (
                  <Link
                    to={`/blog/${nextPost.slug || nextPost.id}`}
                    className="group block p-6 rounded-xl bg-white border border-slate-300 hover:border-brand transition-all duration-300 text-right md:text-left"
                  >
                    <div className="flex items-center justify-end md:justify-start text-brand text-sm font-medium mb-2">
                      Next
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 group-hover:text-brand transition-colors line-clamp-2">
                      {nextPost.title}
                    </h3>
                    {nextPost.order && (
                      <span className="text-xs text-slate-500 mt-2 inline-block">Part {nextPost.order}</span>
                    )}
                  </Link>
                ) : (
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-right">
                    <div className="text-slate-400 text-sm">No next post</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="border-t border-slate-200 pt-12"
            >
              <h2 className="text-3xl font-extrabold text-slate-900 mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link 
                    key={relatedPost.id} 
                    to={`/blog/${relatedPost.slug || relatedPost.id}`}
                    onMouseEnter={() => {
                      // Prefetch related post detail route on hover
                      const link = document.createElement('link');
                      link.rel = 'prefetch';
                      link.href = `/blog/${relatedPost.slug || relatedPost.id}`;
                      link.as = 'document';
                      document.head.appendChild(link);
                    }}
                  >
                    <div className="group rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-brand shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className="relative h-40 overflow-hidden bg-slate-100">
                        <img
                              src={optimizeImageUrl(relatedPost.featuredImage, 200, 30)}
                          srcSet={generateImageSrcset(relatedPost.featuredImage)}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                          alt={relatedPost.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand transition-colors duration-300 line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {relatedPost.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
            </article>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPostDetail;
