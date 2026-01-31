import React, { useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, Share2, Facebook, Twitter, Linkedin, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllBlogPosts } from '@/data/blogPosts';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SEOHead from '@/components/SEOHead';
import { optimizeImageUrl, generateImageSrcset } from '@/lib/utils';

const BlogPostDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Memoize blog posts lookup to prevent unnecessary recalculations
  const allBlogPosts = useMemo(() => getAllBlogPosts(), []);
  const post = useMemo(() => {
    if (!slug) return null;
    const maybeId = Number(slug);
    if (!Number.isNaN(maybeId) && Number.isInteger(maybeId)) {
      return allBlogPosts.find(p => p.id === maybeId);
    }
    return allBlogPosts.find(p => p.slug === slug);
  }, [allBlogPosts, slug]);

  // Redirect numeric/legacy URLs to canonical slug URL
  if (post && slug && post.slug && slug !== post.slug) {
    return <Navigate to={`/blog/${post.slug}`} replace />;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Post Not Found</h1>
          <Link to="/blog">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
              View All Articles
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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

  return (
    <>
      <SEOHead 
        title={post.title}
        description={post.description}
        image={post.featuredImage}
        keywords={`react hooks, useState hook, useEffect hook, custom hooks, functional components, learn how to use react hooks, react hooks tutorial, ${post.category}, ${post.title}, tech blog, programming tutorial, web development, ${post.author}`}
        canonical={`https://www.anandrochlani.com/blog/${post.slug}`}
        type="article"
        authorName={post.author}
        publishedTime={post.date}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar - Related Blogs */}
            {sidebarPosts.length > 1 && (
              <aside className="lg:w-80 flex-shrink-0 order-2 lg:order-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="lg:sticky lg:top-24"
                >
                  <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      {post.series ? post.series : `${post.category} Articles`}
                    </h3>
                    <div className="space-y-2 max-h-[60vh] lg:max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                      {sidebarPosts.map((sidebarPost) => {
                        const isActive = sidebarPost.id === post.id;
                        return (
                          <Link
                            key={sidebarPost.id}
                            to={`/blog/${sidebarPost.slug || sidebarPost.id}`}
                            className={`block p-3 rounded-lg transition-all duration-300 ${
                              isActive
                                ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50'
                                : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-purple-500/30'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {sidebarPost.order && (
                                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isActive
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                    : 'bg-purple-500/20 text-purple-400'
                                }`}>
                                  {sidebarPost.order}
                                </span>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-medium line-clamp-2 ${
                                  isActive ? 'text-white' : 'text-gray-300 hover:text-purple-400'
                                } transition-colors`}>
                                  {sidebarPost.title}
                                </h4>
                                {sidebarPost.order && (
                                  <span className="text-xs text-gray-400 mt-1 block">
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
            <article className="flex-1 max-w-4xl order-1 lg:order-2">
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
              className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Articles
            </Button>
          </motion.div>

          {/* Featured Image */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative h-96 rounded-2xl overflow-hidden mb-8 shadow-2xl"
          >
            <img
              src={optimizeImageUrl(post.featuredImage, 600, 35)}
              srcSet={generateImageSrcset(post.featuredImage)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              alt={post.title}
              loading="eager"
              fetchpriority="high"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          </motion.div>

          {/* Post Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <span className="inline-block px-4 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium mb-4">
              {post.category}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-gray-400 mb-6">
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
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm mr-2">Share:</span>
              <button
                onClick={() => handleShare('Facebook')}
                className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-all duration-300"
                aria-label="Share on Facebook"
              >
                <Facebook className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('Twitter')}
                className="p-2 rounded-lg bg-white/5 hover:bg-sky-500/20 text-gray-400 hover:text-sky-400 transition-all duration-300"
                aria-label="Share on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('LinkedIn')}
                className="p-2 rounded-lg bg-white/5 hover:bg-blue-600/20 text-gray-400 hover:text-blue-600 transition-all duration-300"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('Link')}
                className="p-2 rounded-lg bg-white/5 hover:bg-purple-500/20 text-gray-400 hover:text-purple-400 transition-all duration-300"
                aria-label="Copy link"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Post Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="blog-content prose prose-invert prose-lg max-w-none mb-16"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Series Navigation - Previous/Next */}
          {post.series && (previousPost || nextPost) && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="border-t border-white/10 pt-8 mb-12"
            >
              <div className="mb-4">
                <span className="text-sm text-purple-400 font-medium">{post.series}</span>
                <span className="text-sm text-gray-400 ml-2">Part {post.order}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Previous Post */}
                {previousPost ? (
                  <Link
                    to={`/blog/${previousPost.slug || previousPost.id}`}
                    className="group block p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-all duration-300"
                  >
                    <div className="flex items-center text-purple-400 text-sm font-medium mb-2">
                      <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                      Previous
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                      {previousPost.title}
                    </h3>
                    {previousPost.order && (
                      <span className="text-xs text-gray-400 mt-2 inline-block">Part {previousPost.order}</span>
                    )}
                  </Link>
                ) : (
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10 opacity-50">
                    <div className="text-gray-500 text-sm">No previous post</div>
                  </div>
                )}

                {/* Next Post */}
                {nextPost ? (
                  <Link
                    to={`/blog/${nextPost.slug || nextPost.id}`}
                    className="group block p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-all duration-300 text-right md:text-left"
                  >
                    <div className="flex items-center justify-end md:justify-start text-purple-400 text-sm font-medium mb-2">
                      Next
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                      {nextPost.title}
                    </h3>
                    {nextPost.order && (
                      <span className="text-xs text-gray-400 mt-2 inline-block">Part {nextPost.order}</span>
                    )}
                  </Link>
                ) : (
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10 opacity-50 text-right">
                    <div className="text-gray-500 text-sm">No next post</div>
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
              className="border-t border-white/10 pt-12"
            >
              <h2 className="text-3xl font-bold text-white mb-8">Related Articles</h2>
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
                    <div className="group rounded-xl overflow-hidden bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                      <div className="relative h-40 overflow-hidden">
                        <img
                              src={optimizeImageUrl(relatedPost.featuredImage, 200, 30)}
                          srcSet={generateImageSrcset(relatedPost.featuredImage)}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                          alt={relatedPost.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors duration-300 line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2">
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