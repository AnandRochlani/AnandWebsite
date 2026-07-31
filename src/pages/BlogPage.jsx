import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, Filter, Star } from 'lucide-react';
import { fetchBlogPosts } from '@/data/dbApi';
import SEOHead from '@/components/SEOHead';
import { optimizeImageUrl, generateImageSrcset, highlightDescription } from '@/lib/utils';

const BlogPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [visiblePosts, setVisiblePosts] = useState(4); // Initially show only 4 posts to reduce initial load
  const [allBlogPosts, setAllBlogPosts] = useState([]);
  const observerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    fetchBlogPosts()
      .then((posts) => {
        if (mounted) setAllBlogPosts(Array.isArray(posts) ? posts : []);
      })
      .catch(() => {
        if (mounted) setAllBlogPosts([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Memoize categories to prevent recalculation on every render
  const categories = useMemo(() => ['All', ...new Set(allBlogPosts.map(post => post.category))], [allBlogPosts]);

  const filteredAndSortedPosts = useMemo(() => {
    let posts = selectedCategory === 'All' 
      ? allBlogPosts 
      : allBlogPosts.filter(post => post.category === selectedCategory);

    // For System Design category, sort by order if available, otherwise by date
    if (selectedCategory === 'System Design') {
      posts = [...posts].sort((a, b) => {
        // If both have order, sort by order
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // If only one has order, prioritize it
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        // Otherwise sort by date
        return new Date(b.date) - new Date(a.date);
      });
    } else if (sortBy === 'date') {
      posts = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return posts;
  }, [selectedCategory, sortBy, allBlogPosts]);

  // Memoize featured post to prevent recalculation
  const featuredPost = useMemo(() => allBlogPosts.find(post => post.featured), [allBlogPosts]);

  // Lazy load images using Intersection Observer
  useEffect(() => {
    const images = document.querySelectorAll('img[data-lazy]');
    
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.lazy;
            img.removeAttribute('data-lazy');
            observerRef.current.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px' // Start loading 50px before image is visible
      });

      images.forEach((img) => observerRef.current.observe(img));
    } else {
      // Fallback for browsers without IntersectionObserver
      images.forEach((img) => {
        img.src = img.dataset.lazy;
        img.removeAttribute('data-lazy');
      });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [filteredAndSortedPosts]);

  // Preload featured post image for better LCP
  useEffect(() => {
    if (featuredPost?.featuredImage) {
      const optimizedImage = optimizeImageUrl(featuredPost.featuredImage, 500, 35);
      const existingPreload = document.querySelector(`link[rel="preload"][href="${optimizedImage}"]`);
      if (!existingPreload) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = optimizedImage;
        link.fetchPriority = 'high';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    }
  }, [featuredPost]);

  // Prefetch blog post detail routes dynamically (first 3 visible posts)
  useEffect(() => {
    if (filteredAndSortedPosts.length > 0) {
      // Prefetch first 3 blog post detail routes on idle
      const schedulePrefetch = (callback) => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(callback, { timeout: 2000 });
        } else {
          setTimeout(callback, 100);
        }
      };

      schedulePrefetch(() => {
        const postsToPrefetch = filteredAndSortedPosts.slice(0, 3);
        postsToPrefetch.forEach(post => {
          try {
            const route = `/blog/${post.slug || post.id}`;
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
  }, [filteredAndSortedPosts]);

  return (
      <>
      <SEOHead 
        title="System Design Tutorial Series"
        description="The complete System Design Tutorial series: latency, throughput, caching, sharding, replication, consistent hashing and real interview case studies."
        keywords="system design tutorial, system design interview, scalability, caching, sharding, load balancing, consistent hashing, distributed systems"
        canonical="https://anandrochlani.com/blog"
      />

      <div className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-12"
          >
            <p className="text-brand font-semibold text-sm uppercase tracking-wider mb-3">Insights & Tutorials</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
              Our Blog
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Insights, tutorials, and best practices from industry experts
            </p>
          </motion.div>

          {/* Featured Post */}
          {featuredPost && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-12"
            >
              <Link 
                to={`/blog/${featuredPost.slug || featuredPost.id}`}
                onMouseEnter={() => {
                  // Prefetch featured post detail route on hover
                  const link = document.createElement('link');
                  link.rel = 'prefetch';
                  link.href = `/blog/${featuredPost.slug || featuredPost.id}`;
                  link.as = 'document';
                  document.head.appendChild(link);
                }}
              >
                <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-brand transition-all duration-300 shadow-sm hover:shadow-xl">
                  <div className="absolute top-4 left-4 z-10">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand text-white text-sm font-semibold">
                      <Star className="w-4 h-4 mr-1" />
                      Featured
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative h-64 md:h-full overflow-hidden">
                      <img
                        src={optimizeImageUrl(featuredPost.featuredImage, 500, 35)}
                        srcSet={generateImageSrcset(featuredPost.featuredImage)}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        alt={featuredPost.title}
                        fetchpriority="high"
                        loading="eager"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-semibold">{featuredPost.category}</span>
                        {featuredPost.order && featuredPost.series && (
                          <span className="px-3 py-1 rounded-full bg-brand text-white text-xs font-bold">
                            Part {featuredPost.order}
                          </span>
                        )}
                      </div>
                      {featuredPost.series && (
                        <p className="text-sm text-brand mb-2 font-medium">{featuredPost.series}</p>
                      )}
                      <h2 className="text-3xl font-extrabold text-slate-900 mb-4 group-hover:text-brand transition-colors duration-300">
                        {featuredPost.title}
                      </h2>
                      <div className="mb-6 p-4 rounded-lg bg-brand-soft/50 border border-slate-200 group-hover:border-brand/40 transition-all duration-300">
                      <p className="text-base text-slate-600 line-clamp-3 leading-relaxed font-medium">
                        {highlightDescription(featuredPost.description)}
                      </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(featuredPost.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {featuredPost.readTime}
                          </span>
                        </div>
                        <ArrowRight className="w-6 h-6 text-brand group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-brand" />
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                      selectedCategory === category
                        ? 'bg-brand text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand transition-all duration-300"
            >
              <option value="date" className="bg-white">Latest First</option>
            </select>
          </motion.div>

          {/* Blog Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedPosts.slice(0, visiblePosts).map((post, index) => (
              <div
                key={post.id}
                className="opacity-0 animate-fade-in"
                style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
              >
                <Link 
                  to={`/blog/${post.slug || post.id}`}
                  onMouseEnter={() => {
                    // Prefetch blog post detail route on hover
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = `/blog/${post.slug || post.id}`;
                    link.as = 'document';
                    document.head.appendChild(link);
                  }}
                >
                  <div className="group h-full rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-brand shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img
                        data-lazy={optimizeImageUrl(post.featuredImage, 250, 30)}
                        srcSet={generateImageSrcset(post.featuredImage)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-full bg-white/95 text-brand text-xs font-semibold shadow-sm">
                          {post.category}
                        </span>
                        {post.order && post.series && (
                          <span className="px-3 py-1 rounded-full bg-brand text-white text-xs font-bold shadow-sm">
                            Part {post.order}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand transition-colors duration-300 line-clamp-2 flex-1">
                          {post.title}
                        </h3>
                      </div>
                      {post.series && (
                        <p className="text-xs text-brand mb-2 font-medium">{post.series}</p>
                      )}
                      <div className="mb-4">
                        <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                          {highlightDescription(post.description)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(post.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          
          {/* Load More Button */}
          {filteredAndSortedPosts.length > visiblePosts && (
            <div className="text-center mt-12">
              <button
                onClick={() => setVisiblePosts(prev => Math.min(prev + 4, filteredAndSortedPosts.length))}
                className="px-6 py-3 bg-brand hover:bg-brand-dark text-white rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                Load More Posts
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogPage;