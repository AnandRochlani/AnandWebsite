import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, TrendingUp, Search, Filter, Star, BookOpen, Crown, ExternalLink } from 'lucide-react';
import { getAllCourses } from '@/data/courses';
import SaveButton from '@/components/SaveButton';
import SEOHead from '@/components/SEOHead';
import { optimizeImageUrl, generateImageSrcset } from '@/lib/utils';

const CoursesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCourses, setVisibleCourses] = useState(4); // Initially show only 4 courses to reduce initial load

  // Memoize courses to prevent unnecessary recalculations
  const allCourses = useMemo(() => getAllCourses(), []);

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
        title="Online Courses - Web Dev & Design"
        description="Browse expert-led courses in web development, design, and data science. Learn React, JavaScript, Node.js, UI/UX, and machine learning with hands-on projects."
        keywords="web development courses, react courses, javascript courses, node.js courses, UI/UX design courses, data science courses, machine learning courses, programming courses, online coding courses"
        canonical="https://www.anandrochlani.com/courses"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Explore <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Courses</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Master new skills with comprehensive courses taught by industry experts
            </p>
          </motion.div>

          {/* Featured Courses */}
          {featuredCourses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Star className="w-6 h-6 text-yellow-400 mr-2" />
                Featured Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredCourses.map((course, index) => {
                  const isSystemDesign = course.category === 'System Design';
                  const cardClassName = isSystemDesign
                    ? "group relative h-full rounded-xl overflow-hidden bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-slate-900/40 backdrop-blur-sm border border-blue-500/30 hover:border-blue-400/60 shadow-lg hover:shadow-blue-500/20 hover:scale-105 transition-all duration-300"
                    : "group relative h-full rounded-xl overflow-hidden bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-yellow-500/30 hover:border-yellow-500/60 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300";

                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <Link to={`/courses/${course.id}`}>
                        <div className={cardClassName}>
                          {/* Featured Badge - moved to left */}
                          <div className="absolute top-4 left-4 z-10 flex gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-medium shadow-md">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </span>
                            {isSystemDesign && (
                               <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium shadow-md animate-pulse">
                                <Crown className="w-3 h-3 mr-1" />
                                Premium
                              </span>
                            )}
                          </div>
                          
                          {/* Save Button - Added to right */}
                          <div className="absolute top-4 right-4 z-10">
                            <SaveButton 
                              courseId={course.id} 
                              className="bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10"
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
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                          </div>
                          <div className="p-6">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${isSystemDesign ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                              {course.category}
                            </span>
                            <h3 className={`text-xl font-bold text-white mb-3 transition-colors duration-300 line-clamp-2 ${isSystemDesign ? 'group-hover:text-blue-400' : 'group-hover:text-purple-400'}`}>
                              {course.name}
                            </h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                              {course.description}
                            </p>
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {course.duration}
                              </span>
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {typeof course.studentsEnrolled === 'number' ? course.studentsEnrolled.toLocaleString() : course.studentsEnrolled}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold text-white">{course.price}</span>
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-white font-medium">{course.rating}</span>
                              </div>
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
            className="mb-8 space-y-4"
          >
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-purple-400" />
                <span className="text-gray-300 font-medium">Category:</span>
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

              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="text-gray-300 font-medium">Level:</span>
                <div className="flex flex-wrap gap-2">
                  {levels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        selectedLevel === level
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
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
            <p className="text-gray-400">
              Showing <span className="text-white font-medium">{filteredCourses.length}</span> courses
            </p>
          </motion.div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.slice(0, visibleCourses).map((course, index) => {
              const isSystemDesign = course.category === 'System Design';
              const cardClassName = isSystemDesign
                ? "group h-full rounded-xl overflow-hidden bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-slate-900/40 backdrop-blur-sm border border-blue-500/30 hover:border-blue-400/60 shadow-lg hover:shadow-blue-500/20 hover:scale-105 transition-all duration-300"
                : "group h-full rounded-xl overflow-hidden bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300";

              return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link to={`/courses/${course.id}`}>
                  <div className={cardClassName}>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        data-lazy={optimizeImageUrl(course.featuredImage, 250, 30)}
                        srcSet={generateImageSrcset(course.featuredImage)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        alt={course.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                      
                      {/* Category Badge - Top Left */}
                      <span className={`absolute top-4 left-4 px-3 py-1 rounded-full backdrop-blur-sm text-white text-xs font-medium ${isSystemDesign ? 'bg-blue-500/80' : 'bg-purple-500/80'}`}>
                        {course.category}
                      </span>
                      
                      {/* Save Button - Top Right */}
                      <div className="absolute top-4 right-4 z-10">
                        <SaveButton 
                          courseId={course.id} 
                          className="bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10"
                        />
                      </div>
                      
                      {/* Level Badge - Moved to Bottom Right */}
                      <span className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-blue-500/80 backdrop-blur-sm text-white text-xs font-medium">
                        {course.level}
                      </span>

                      {/* External Link Icon for System Design */}
                      {isSystemDesign && (
                         <div className="absolute bottom-4 left-4 p-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white">
                           <ExternalLink className="w-4 h-4" />
                         </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className={`text-xl font-bold text-white mb-3 transition-colors duration-300 line-clamp-2 ${isSystemDesign ? 'group-hover:text-blue-400' : 'group-hover:text-purple-400'}`}>
                        {course.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      <p className="text-gray-500 text-sm mb-4">by {course.instructor}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {course.duration}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {typeof course.studentsEnrolled === 'number' ? course.studentsEnrolled.toLocaleString() : course.studentsEnrolled}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-2xl font-bold text-white">{course.price}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-white font-medium">{course.rating}</span>
                        </div>
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
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
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
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No courses found</h3>
              <p className="text-gray-400">Try adjusting your filters or search query</p>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default CoursesPage;