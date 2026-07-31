import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, TrendingUp, Search, Filter, Star, BookOpen, Crown, ExternalLink } from 'lucide-react';
import { fetchCourses } from '@/data/dbApi';
import { isInProduction } from '@/data/courses';
import SaveButton from '@/components/SaveButton';
import SEOHead from '@/components/SEOHead';
import { optimizeImageUrl, generateImageSrcset } from '@/lib/utils';
import { slugify } from '@/lib/slug.js';

const CoursesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCourses, setVisibleCourses] = useState(4); // Initially show only 4 courses to reduce initial load
  const [allCourses, setAllCourses] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchCourses()
      .then((courses) => {
        if (mounted) setAllCourses(Array.isArray(courses) ? courses : []);
      })
      .catch(() => {
        if (mounted) setAllCourses([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Memoize categories and levels to prevent recalculation on every render
  const categories = useMemo(() => ['All', ...new Set(allCourses.map(course => course.category))], [allCourses]);
  const levels = useMemo(() => ['All', 'Beginner', 'Intermediate', 'Advanced'], []);

  const filteredCourses = useMemo(() => {
    return allCourses.filter(course => {
      const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
      const matchesLevel = selectedLevel === 'All' || course.level.includes(selectedLevel);
      const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesLevel && matchesSearch;
    });
  }, [selectedCategory, selectedLevel, searchQuery, allCourses]);

  // Memoize featured courses to prevent recalculation
  const featuredCourses = useMemo(() => allCourses.filter(course => course.featured), [allCourses]);

  const observerRef = useRef(null);

  // Preload featured course images for better LCP
  useEffect(() => {
    if (featuredCourses.length > 0) {
      featuredCourses.slice(0, 2).forEach(course => { // Only preload first 2 to reduce initial load
        if (course.featuredImage) {
          const optimizedImage = optimizeImageUrl(course.featuredImage, 350, 30);
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
      });
    }
  }, [featuredCourses]);

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
        rootMargin: '50px'
      });

      images.forEach((img) => observerRef.current.observe(img));
    } else {
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
  }, [filteredCourses]);

  return (
      <>
      <SEOHead
        title="Interview Prep Courses"
        description="Interview-focused engineering courses: system design fundamentals plus the LeetCode patterns behind the Amazon and Google coding interviews."
        keywords="system design course, coding interview course, leetcode patterns course, amazon interview prep, google interview prep, scalability"
        canonical="https://anandrochlani.com/courses"
      />

      <div className="min-h-screen bg-white pb-16">
        {/* Header band */}
        <div className="bg-gradient-to-b from-ink to-ink-2 pt-32 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4">
                Build interview-ready <span className="text-lavender">System Design &amp; coding skills</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
                Compare the learning paths, review exactly what is included, and choose the course that fits your current level.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          {/* Featured Courses */}
          {featuredCourses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center">
                <Star className="w-6 h-6 text-amber-500 mr-2" />
                Featured Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredCourses.map((course, index) => {
                  const isSystemDesign = course.category === 'System Design';
                  const upcoming = isInProduction(course);
                  const cardClassName = "group relative h-full rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300";

                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <Link to={`/courses/${course.slug || slugify(course.name)}`}>
                        <div className={cardClassName}>
                          {/* Featured Badge - moved to left */}
                          <div className="absolute top-4 left-4 z-10 flex gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand text-white text-xs font-semibold shadow-md">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </span>
                            {isSystemDesign && (
                               <span className="inline-flex items-center px-3 py-1 rounded-full bg-ink text-white text-xs font-semibold shadow-md">
                                <Crown className="w-3 h-3 mr-1" />
                                Premium
                              </span>
                            )}
                          </div>

                          {/* Save Button - Added to right */}
                          <div className="absolute top-4 right-4 z-10">
                            <SaveButton
                              courseId={course.id}
                              className="bg-black/40 backdrop-blur-md hover:bg-black/60 border border-white/10"
                            />
                          </div>

                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={optimizeImageUrl(course.featuredImage, 350, 30)}
                              srcSet={generateImageSrcset(course.featuredImage)}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              alt={course.name}
                              fetchPriority={index < 3 ? "high" : "auto"}
                              loading={index < 3 ? "eager" : "lazy"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="p-6">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-brand-soft text-brand">
                              {course.category}
                            </span>
                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brand transition-colors duration-300 line-clamp-2">
                              {course.name}
                            </h3>
                            <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                              {course.description}
                            </p>
                            <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {course.duration}
                              </span>
                              {!upcoming && (
                                <span className="flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  {typeof course.studentsEnrolled === 'number' ? course.studentsEnrolled.toLocaleString() : course.studentsEnrolled}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={upcoming ? 'text-lg font-bold text-slate-900' : 'text-2xl font-bold text-slate-900'}>{course.price}</span>
                              {!upcoming && course.rating != null && (
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                  <span className="text-slate-900 font-medium">{course.rating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6"
          >
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by topic, level, or instructor"
                aria-label="Search courses"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-300"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-brand" />
                <span className="text-slate-700 font-medium">Category:</span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      aria-pressed={selectedCategory === category}
                      className={`min-h-11 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        selectedCategory === category
                          ? 'bg-brand text-white shadow-sm'
                          : 'bg-white border border-slate-300 text-slate-600 hover:border-brand hover:text-brand'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-brand" />
                <span className="text-slate-700 font-medium">Level:</span>
                <div className="flex flex-wrap gap-2">
                  {levels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      aria-pressed={selectedLevel === level}
                      className={`min-h-11 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        selectedLevel === level
                          ? 'bg-brand text-white shadow-sm'
                          : 'bg-white border border-slate-300 text-slate-600 hover:border-brand hover:text-brand'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-6"
          >
            <p className="text-slate-600">
              Showing <span className="text-slate-900 font-semibold">{filteredCourses.length}</span> courses
            </p>
          </motion.div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.slice(0, visibleCourses).map((course, index) => {
              const isSystemDesign = course.category === 'System Design';
              const upcoming = isInProduction(course);
              const cardClassName = "group h-full rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300";

              return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link to={`/courses/${course.slug || slugify(course.name)}`} className="block h-full rounded-2xl focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4">
                  <div className={cardClassName}>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        data-lazy={optimizeImageUrl(course.featuredImage, 250, 30)}
                        srcSet={generateImageSrcset(course.featuredImage)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        alt={course.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Save Button - Top Right */}
                      <div className="absolute top-4 right-4 z-10">
                        <SaveButton
                          courseId={course.id}
                          className="bg-black/40 backdrop-blur-md hover:bg-black/60 border border-white/10"
                        />
                      </div>

                      {/* External Link Icon for System Design */}
                      {isSystemDesign && (
                         <div className="absolute bottom-4 left-4 p-1.5 rounded-full bg-white/90 shadow text-slate-700">
                           <ExternalLink className="w-4 h-4" />
                         </div>
                      )}
                      {upcoming && (
                        <span className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold">
                          In production
                        </span>
                      )}
                    </div>
                    <div className="p-6">
                      {/* Category + Level chips */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-semibold">
                          {course.category}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                          {course.level}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brand transition-colors duration-300 line-clamp-2">
                        {course.name}
                      </h3>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      <p className="text-slate-500 text-sm mb-4">by {course.instructor}</p>
                      <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {course.duration}
                        </span>
                        {!upcoming && (
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {typeof course.studentsEnrolled === 'number' ? course.studentsEnrolled.toLocaleString() : course.studentsEnrolled}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <span className={upcoming ? 'text-lg font-bold text-slate-900' : 'text-2xl font-bold text-slate-900'}>{course.price}</span>
                        {!upcoming && course.rating != null && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-slate-900 font-medium">{course.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
              );
            })}
          </div>

          {/* Load More Button */}
          {filteredCourses.length > visibleCourses && (
            <div className="text-center mt-12">
              <button
                onClick={() => setVisibleCourses(prev => Math.min(prev + 4, filteredCourses.length))}
                className="px-6 py-3 bg-brand hover:bg-brand-dark text-white rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow-lg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                Load More Courses
              </button>
            </div>
          )}

          {/* No Results */}
          {filteredCourses.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-16"
            >
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No courses found</h3>
              <p className="text-slate-500">Try adjusting your filters or search query</p>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default CoursesPage;
