import React, { useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, Star, ArrowLeft, BookOpen, CheckCircle, PlayCircle, ExternalLink, Award, Sparkles } from 'lucide-react';
import { getAllCourses } from '@/data/courses';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SaveButton from '@/components/SaveButton';
import SEOHead from '@/components/SEOHead';
import { optimizeImageUrl, generateImageSrcset } from '@/lib/utils';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Memoize courses lookup to prevent unnecessary recalculations
  const allCourses = useMemo(() => getAllCourses(), []);
  const course = useMemo(() => {
    if (!id) return null;
    return allCourses.find(c => c.id === parseInt(id));
  }, [allCourses, id]);

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Course Not Found</h1>
          <Link to="/courses">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
              View All Courses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleEnroll = () => {
    if (course.isExternal && course.externalUrl) {
      window.open(course.externalUrl, '_blank');
    } else {
      toast({
        title: "Enrollment Feature",
        description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
      });
    }
  };

  // Memoize related courses to prevent recalculation
  const relatedCourses = useMemo(() => {
    if (!course) return [];
    return allCourses
      .filter(c => c.category === course.category && c.id !== course.id)
      .slice(0, 3);
  }, [allCourses, course]);
    
  const isSystemDesign = useMemo(() => course?.category === 'System Design', [course]);

  // Preload course featured image for better LCP
  useEffect(() => {
    if (course?.featuredImage) {
      const optimizedImage = optimizeImageUrl(course.featuredImage, 600, 35);
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
  }, [course]);

  return (
    <>
      <SEOHead 
        title={`${course.name} - ${course.category} Course | Beginner to Advanced`}
        description={`${course.description} Learn ${course.name} with ${course.instructor}. ${course.level} level ${course.category.toLowerCase()} course. ${course.duration} of content. ${course.rating} star rating. Master web development, React, Context API, and more. Enroll now!`}
        image={course.featuredImage}
        keywords={`${course.name}, ${course.category}, ${course.level} course, ${course.instructor}, online course, learn ${course.category.toLowerCase()}, web development, context api, beginner to advanced, react course, web development course, lessons 3, lessons 4`}
        canonical={`https://www.anandrochlani.com/courses/${course.id}`}
        type="Course"
      />

      <div className={`min-h-screen pt-24 pb-16 ${isSystemDesign ? 'bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900' : 'bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900'}`}>
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Button
              onClick={() => navigate('/courses', { replace: true })}
              variant="outline"
              className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Courses
            </Button>
          </motion.div>
        </div>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${isSystemDesign ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  {course.category}
                </span>
                {isSystemDesign && (
                   <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold shadow-md animate-pulse">
                    <Sparkles className="w-3 h-3 mr-1" />
                    PREMIUM
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
                {course.name}
              </h1>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">{course.description}</p>

              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center space-x-2">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor)}&background=random`}
                    alt={course.instructor}
                    className="w-12 h-12 rounded-full border-2 border-white/10"
                  />
                  <div>
                    <p className="text-white font-medium">{course.instructor}</p>
                    <p className="text-gray-400 text-sm">Instructor</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-gray-400">
                  <span className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-1" />
                    <span className="text-white font-medium">{course.rating}</span>
                  </span>
                  <span className="flex items-center">
                    <Users className="w-5 h-5 mr-1" />
                    {typeof course.studentsEnrolled === 'number' ? course.studentsEnrolled.toLocaleString() : course.studentsEnrolled} students
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-5 h-5 mr-1" />
                    {course.duration}
                  </span>
                </div>
              </div>

              <div className="relative h-96 rounded-2xl overflow-hidden mb-8 shadow-2xl border border-white/10 group">
                <img
                  src={optimizeImageUrl(course.featuredImage, 600, 35)}
                  srcSet={generateImageSrcset(course.featuredImage)}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                  alt={course.name}
                  fetchPriority="high"
                  loading="eager"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent flex items-center justify-center">
                  <button className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/50 flex items-center justify-center hover:scale-110 hover:bg-white/30 transition-all duration-300">
                    <PlayCircle className="w-10 h-10 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Enrollment Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className={`sticky top-24 rounded-2xl backdrop-blur-sm border p-6 shadow-2xl ${isSystemDesign ? 'bg-gradient-to-br from-blue-900/20 to-slate-900/20 border-blue-500/30' : 'bg-gradient-to-br from-white/10 to-white/5 border-white/20'}`}>
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold text-white">{course.price}</span>
                </div>

                <Button
                  onClick={handleEnroll}
                  className={`w-full py-6 text-lg rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 mb-4 text-white ${isSystemDesign ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'}`}
                >
                  {course.isExternal ? (
                    <span className="flex items-center">
                      Enroll on Udemy <ExternalLink className="w-5 h-5 ml-2" />
                    </span>
                  ) : (
                    "Enroll Now"
                  )}
                </Button>

                {/* Save Button in Sticky Sidebar */}
                <div className="flex justify-center mb-6">
                   <SaveButton 
                    courseId={course.id} 
                    showText={true}
                    className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl"
                  />
                </div>

                <div className="space-y-3 text-gray-300">
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <span>Level</span>
                    <span className="font-medium text-white">{course.level}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <span>Duration</span>
                    <span className="font-medium text-white">{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <span>Modules</span>
                    <span className="font-medium text-white">{course.modules.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Students</span>
                    <span className="font-medium text-white">{typeof course.studentsEnrolled === 'number' ? course.studentsEnrolled.toLocaleString() : course.studentsEnrolled}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Course Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Learning Outcomes for System Design Course */}
              {course.learningOutcomes && (
                 <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className={`rounded-2xl backdrop-blur-sm border p-8 ${isSystemDesign ? 'bg-blue-900/10 border-blue-500/20' : 'bg-white/5 border-white/10'}`}
                >
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <Award className={`w-6 h-6 mr-2 ${isSystemDesign ? 'text-blue-400' : 'text-purple-400'}`} />
                    What you'll learn
                  </h2>
                  <div className="grid md:grid-cols-1 gap-4">
                    {course.learningOutcomes.map((outcome, idx) => (
                      <div key={idx} className="flex items-start">
                        <CheckCircle className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${isSystemDesign ? 'text-blue-400' : 'text-green-400'}`} />
                        <span className="text-gray-300">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* About Instructor */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 p-8"
              >
                <h2 className="text-2xl font-bold text-white mb-4">About the Instructor</h2>
                <p className="text-gray-300 leading-relaxed">{course.instructorBio}</p>
              </motion.div>

              {/* Detailed Course Content */}
              {course.detailedContent && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 p-8"
                >
                  <h2 className="text-2xl font-bold text-white mb-6">Course Overview</h2>
                  <div 
                    className="prose prose-invert prose-lg max-w-none text-slate-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: course.detailedContent }}
                  />
                </motion.div>
              )}

              {/* Course Modules */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 p-8"
              >
                <h2 className={`text-2xl font-bold text-white mb-6 flex items-center`}>
                  <BookOpen className={`w-6 h-6 mr-2 ${isSystemDesign ? 'text-blue-400' : 'text-purple-400'}`} />
                  Course Curriculum
                </h2>
                <div className="space-y-4">
                  {course.modules.map((module, index) => (
                    <motion.div
                      key={module.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="rounded-lg bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="mt-1">
                            <CheckCircle className={`w-5 h-5 ${isSystemDesign ? 'text-blue-400' : 'text-purple-400'}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-medium mb-1">{module.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span>{module.lessons} lessons</span>
                              <span>•</span>
                              <span>{module.duration}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Related Courses */}
            <div className="lg:col-span-1">
              {relatedCourses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 p-6"
                >
                  <h2 className="text-xl font-bold text-white mb-6">Related Courses</h2>
                  <div className="space-y-4">
                    {relatedCourses.map((relatedCourse) => (
                      <Link key={relatedCourse.id} to={`/courses/${relatedCourse.id}`}>
                        <div className="group rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all duration-300">
                          <div className="relative h-32 overflow-hidden">
                            <img
                              src={optimizeImageUrl(relatedCourse.featuredImage, 200, 30)}
                              srcSet={generateImageSrcset(relatedCourse.featuredImage)}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                              alt={relatedCourse.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {/* Small save button on related courses for convenience */}
                             <div className="absolute top-2 right-2 z-10">
                              <SaveButton 
                                courseId={relatedCourse.id} 
                                className="w-8 h-8 p-1.5 bg-black/30 backdrop-blur-sm hover:bg-black/50"
                              />
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="text-white font-medium mb-2 group-hover:text-purple-400 transition-colors duration-300 line-clamp-2">
                              {relatedCourse.name}
                            </h3>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-purple-400 font-bold">{relatedCourse.price}</span>
                              <div className="flex items-center text-gray-400">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
                                <span>{relatedCourse.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseDetail;