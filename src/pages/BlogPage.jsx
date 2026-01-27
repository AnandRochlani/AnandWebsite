import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, Filter, Star } from 'lucide-react';
import { getAllBlogPosts } from '@/data/blogPosts';
import SEOHead from '@/components/SEOHead';
import { optimizeImageUrl, generateImageSrcset } from '@/lib/utils';

const BlogPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [visiblePosts, setVisiblePosts] = useState(4); // Initially show only 4 posts to reduce initial load
  const observerRef = useRef(null);

  // Memoize blog posts to prevent unnecessary recalculations
  const allBlogPosts = useMemo(() => getAllBlogPosts(), []);

  // Memoize categories to prevent recalculation on every render
  const categories = useMemo(() => ['All', ...new Set(allBlogPosts.map(post => post.category))], [allBlogPosts]);

  const filteredAndSortedPosts = useMemo(() => {
    let posts = selectedCategory === 'All' 
      ? allBlogPosts 
      : allBlogPosts.filter(post => post.category === selectedCategory);

    if (sortBy === 'date') {
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
      const optimizedImage = optimizeImageUrl(featuredPost.featuredImage, 500, 40);
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
            const route = `/blog/${post.id}`;
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
        title="Tech Blog - Web Dev, Design & Data Science"
        description="Explore articles and tutorials on web development, design, and data science. Stay updated with latest tech trends and best practices from experts."
        keywords="web development blog, react tutorials, javascript tutorials, programming blog, UI/UX design articles, data science blog, tech tutorials, coding blog, software development articles"
        canonical="https://www.anandrochlani.com/blog"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Blog</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
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
                to={`/blog/${featuredPost.id}`}
                onMouseEnter={() => {
                  // Prefetch featured post detail route on hover
                  const link = document.createElement('link');
                  link.rel = 'prefetch';
                  link.href = `/blog/${featuredPost.id}`;
                  link.as = 'document';
                  document.head.appendChild(link);
                }}
              >
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-2xl">
                  <div className="absolute top-4 left-4 z-10">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-medium">
                      <Star className="w-4 h-4 mr-1" />
                      Featured
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative h-64 md:h-full overflow-hidden">
                      <img
                        src={optimizeImageUrl(featuredPost.featuredImage, 500, 40)}
                        srcSet={generateImageSrcset(featuredPost.featuredImage)}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        alt={featuredPost.title}
                        fetchPriority="high"
                        loading="eager"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-transparent" />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      <span className="text-purple-400 text-sm font-medium mb-2">{featuredPost.category}</span>
                      <h2 className="text-3xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors duration-300">
                        {featuredPost.title}
                      </h2>
                      <p className="text-gray-300 mb-6 line-clamp-3">{featuredPost.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(featuredPost.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {featuredPost.readTime}
                          </span>
                        </div>
                        <ArrowRight className="w-6 h-6 text-purple-400 group-hover:translate-x-2 transition-transform duration-300" />
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
              <Filter className="w-5 h-5 text-purple-400" />
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
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
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
            >
              <option value="date" className="bg-slate-800">Latest First</option>
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
                  to={`/blog/${post.id}`}
                  onMouseEnter={() => {
                    // Prefetch blog post detail route on hover
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = `/blog/${post.id}`;
                    link.as = 'document';
                    document.head.appendChild(link);
                  }}
                >
                  <div className="group h-full rounded-xl overflow-hidden bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <div className="relative h-48 overflow-hidden bg-slate-800">
                      <img
                        data-lazy={optimizeImageUrl(post.featuredImage, 250, 40)}
                        srcSet={generateImageSrcset(post.featuredImage)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                      <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-purple-500/80 backdrop-blur-sm text-white text-xs font-medium">
                        {post.category}
                      </span>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors duration-300 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                        {post.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
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
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
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