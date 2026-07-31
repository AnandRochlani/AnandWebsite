import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, Star, BookOpen, Trash2 } from 'lucide-react';
import { useSavedCourses } from '@/context/SavedCoursesContext';
import SaveButton from '@/components/SaveButton';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import { optimizeImageUrl, generateImageSrcset } from '@/lib/utils';
import { slugify } from '@/lib/slug.js';

const SavedCoursesPage = () => {
  const { getSavedCourses, removeSavedCourse } = useSavedCourses();
  const [filter, setFilter] = useState('All');

  // Get saved courses (function is stable from context)
  const savedCourses = getSavedCourses();

  // Memoize categories to prevent recalculation on every render
  const categories = useMemo(() => ['All', ...new Set(savedCourses.map(course => course.category))], [savedCourses]);

  // Memoize filtered courses to prevent recalculation
  const filteredCourses = useMemo(() => {
    return filter === 'All'
      ? savedCourses
      : savedCourses.filter(course => course.category === filter);
  }, [savedCourses, filter]);

  return (
    <>
      <SEOHead
        title="My Courses"
        description="View and manage your saved courses. Access your personal learning wishlist and continue your learning journey."
        canonical="https://anandrochlani.com/saved-courses"
      />

      <div className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <p className="text-brand font-semibold text-sm uppercase tracking-wider mb-2">
              My Learning
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
              My Courses
            </h1>
            <p className="text-xl text-slate-600">
              Your personal learning wishlist
            </p>
          </motion.div>

          {savedCourses.length > 0 ? (
            <>
              {/* Filters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8 flex flex-wrap gap-2"
              >
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setFilter(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      filter === category
                        ? 'bg-brand text-white shadow-sm'
                        : 'bg-white border border-slate-300 text-slate-600 hover:border-brand hover:text-brand'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </motion.div>

              {/* Courses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Link to={`/courses/${course.slug || slugify(course.name)}`}>
                      <div className="group h-full rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={optimizeImageUrl(course.featuredImage, 250, 30)}
                            srcSet={generateImageSrcset(course.featuredImage)}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            alt={course.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* Save Button */}
                          <div className="absolute top-4 right-4 z-10">
                            <SaveButton
                              courseId={course.id}
                              className="bg-black/40 backdrop-blur-md hover:bg-black/60"
                            />
                          </div>
                        </div>
                        <div className="p-6">
                          <span className="inline-block px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-semibold mb-3">
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
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {course.studentsEnrolled.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <span className="text-2xl font-bold text-slate-900">{course.price}</span>
                            <Button
                              onClick={(e) => {
                                e.preventDefault();
                                removeSavedCourse(course.id);
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200"
            >
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No courses saved yet</h3>
              <p className="text-slate-500 mb-6">Start exploring and save courses for later!</p>
              <Link to="/courses">
                <Button className="bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg">
                  Explore Courses
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default SavedCoursesPage;
