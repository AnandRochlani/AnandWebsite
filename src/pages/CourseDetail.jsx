import React, { useMemo, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, Star, ArrowLeft, BookOpen, CheckCircle, PlayCircle, ExternalLink, Award, Sparkles } from 'lucide-react';
import { fetchCourseBySlugOrId } from '@/data/dbApi';
import { slugify } from '@/lib/slug.js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SaveButton from '@/components/SaveButton';
import SEOHead from '@/components/SEOHead';
import { optimizeImageUrl, generateImageSrcset } from '@/lib/utils';

const CourseDetail = () => {
  // Route param is :slugOrId so the URL is human-readable, but we still
  // accept a numeric id (fetchCourseBySlug detects it and routes accordingly).
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        if (!slugOrId) {
          if (mounted) setCourse(null);
          return;
        }
        const result = await fetchCourseBySlugOrId(slugOrId);
        if (mounted) setCourse(result);

        // If the user arrived via a legacy numeric URL (/courses/9), replace it
        // with the canonical slug URL once we know the slug.
        const isNumeric = /^[0-9]+$/.test(String(slugOrId));
        if (isNumeric && result?.slug) {
          navigate(`/courses/${result.slug}`, { replace: true });
        }
      } catch (e) {
        if (mounted) setCourse(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [slugOrId, navigate]);

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

  // With DB-backed catalog currently containing a single course, related list is empty.
  const relatedCourses = useMemo(() => [], []);

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

  const isNotFound = !loading && !course;

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Course Not Found</h1>
          <Link to="/courses">
            <Button className="bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg">
              View All Courses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${course.name} Course`}
        description="Master scalability, load balancing, caching, databases, and distributed systems in this practical system design course for interview preparation."
        image={course.featuredImage}
        keywords={`${course.name}, ${course.category}, ${course.level} course, ${course.instructor}, online course, learn ${course.category.toLowerCase()}`}
        canonical={`https://anandrochlani.com/courses/${course.slug || slugify(course.name)}`}
        type="website"
      />

      <div className="min-h-screen pt-24 pb-16 bg-white">
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
              className="min-h-11 bg-white border-slate-300 text-slate-700 hover:border-brand hover:text-brand rounded-lg"
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
                <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold bg-brand-soft text-brand">
                  {course.category}
                </span>
                {isSystemDesign && (
                   <span className="inline-flex items-center px-3 py-1 rounded-full bg-ink text-white text-xs font-bold shadow-md">
                    <Sparkles className="w-3 h-3 mr-1" />
                    PREMIUM
                  </span>
                )}
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
                {course.name}
              </h1>
              <p className="text-xl text-slate-600 mb-6 leading-relaxed">{course.description}</p>

              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center space-x-2">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor)}&background=random`}
                    alt={course.instructor}
                    className="w-12 h-12 rounded-full border-2 border-slate-200"
                  />
                  <div>
                    <p className="text-slate-900 font-semibold">{course.instructor}</p>
                    <p className="text-slate-500 text-sm">Instructor</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-slate-500">
                  <span className="flex items-center">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500 mr-1" />
                    <span className="text-slate-900 font-medium">{course.rating}</span>
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

              <div className="relative h-96 rounded-2xl overflow-hidden mb-8 shadow-lg border border-slate-200 group">
                <img
                  src={optimizeImageUrl(course.featuredImage, 600, 35)}
                  srcSet={generateImageSrcset(course.featuredImage)}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                  alt={course.name}
                  fetchPriority="high"
                  loading="eager"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent flex items-center justify-center" aria-hidden="true">
                  <button tabIndex="-1" className="hidden w-20 h-20 rounded-full bg-white/90 border-4 border-white items-center justify-center">
                    <PlayCircle className="w-10 h-10 text-brand" />
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
              <div className="sticky top-24 rounded-2xl bg-white border border-slate-200 p-6 shadow-xl">
                <div className="text-center mb-6">
                  <span className="text-5xl font-extrabold text-slate-900">{course.price}</span>
                </div>

                <Button
                  onClick={handleEnroll}
                  className="w-full py-6 text-lg rounded-xl font-semibold shadow-sm hover:shadow-lg transition-all duration-300 mb-4 bg-brand hover:bg-brand-dark text-white"
                >
                  {course.isExternal ? (
                    <span className="flex items-center">
                      Enroll on Udemy <ExternalLink className="w-5 h-5 ml-2" />
                    </span>
                  ) : (
                    "Enroll Now"
                  )}
                </Button>
                <p className="mb-4 text-center text-xs text-slate-500">
                  You’ll review the destination before completing enrollment.
                </p>

                {/* Save Button in Sticky Sidebar */}
                <div className="flex justify-center mb-6">
                   <SaveButton
                    courseId={course.id}
                    showText={true}
                    className="w-full py-3 bg-ink hover:bg-ink-2 rounded-xl"
                  />
                </div>

                <div className="space-y-3 text-slate-600">
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <span>Level</span>
                    <span className="font-medium text-slate-900">{course.level}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <span>Duration</span>
                    <span className="font-medium text-slate-900">{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <span>Modules</span>
                    <span className="font-medium text-slate-900">{course.modules.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Students</span>
                    <span className="font-medium text-slate-900">{typeof course.studentsEnrolled === 'number' ? course.studentsEnrolled.toLocaleString() : course.studentsEnrolled}</span>
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
                  className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8"
                >
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <Award className="w-6 h-6 mr-2 text-brand" />
                    What you'll learn
                  </h2>
                  <div className="grid md:grid-cols-1 gap-4">
                    {course.learningOutcomes.map((outcome, idx) => (
                      <div key={idx} className="flex items-start">
                        <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-brand" />
                        <span className="text-slate-600">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {isSystemDesign && (
                <motion.section
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8"
                >
                  <h2 className="text-2xl font-bold text-slate-900">Free tutorials or the guided course?</h2>
                  <p className="mt-3 text-slate-600 leading-relaxed">
                    Both cover the same practical System Design foundation. Choose the format
                    that fits how you learn and how soon your interview is.
                  </p>
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-900">
                          <th className="py-3 pr-4">Option</th>
                          <th className="py-3 pr-4">Best for</th>
                          <th className="py-3">Includes</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600">
                        <tr className="border-b border-slate-100">
                          <th className="py-4 pr-4 font-semibold text-slate-900">Free tutorials</th>
                          <td className="py-4 pr-4">Learning one topic or case study at a time</td>
                          <td className="py-4">Written guides, roadmap, glossary, and checklist</td>
                        </tr>
                        <tr>
                          <th className="py-4 pr-4 font-semibold text-slate-900">Udemy course</th>
                          <td className="py-4 pr-4">Following one guided video curriculum</td>
                          <td className="py-4">5h 40m, 49 lectures, and four complete case-study sections</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold">
                    <Link to="/blog/system-design-interview-preparation-complete-guide-2026" className="text-brand">
                      Follow the free roadmap →
                    </Link>
                    <Link to="/system-design-case-studies" className="text-brand">
                      Browse case studies →
                    </Link>
                  </div>
                </motion.section>
              )}

              {isSystemDesign && (
                <motion.section
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8"
                >
                  <h2 className="text-2xl font-bold text-slate-900">Frequently asked questions</h2>
                  <div className="mt-6 space-y-6">
                    {[
                      ['Who is this System Design course for?', 'It is designed for beginners, junior engineers, career switchers, and self-learners preparing for entry-level or early-career System Design interviews.'],
                      ['Do I need prior System Design experience?', 'No. Basic programming knowledge and a general understanding of clients, servers, and APIs are helpful, but the curriculum begins with core terminology.'],
                      ['What case studies are included?', 'The course covers a social bookmarking service, consistent hashing, a coding contest platform, Facebook News Feed, and Google Typeahead.'],
                      ['How long is the course?', 'The current Udemy curriculum contains 8 sections, 49 lectures, and 5 hours 40 minutes of video.'],
                      ['Can I start with the free material?', 'Yes. The free roadmap, glossary, checklist, and case studies are complete learning resources. Choose the course when you prefer a guided video sequence.'],
                      ['Does the course guarantee an interview result?', 'No course can guarantee a hiring outcome. It provides a structured foundation and practice material; results also depend on experience, communication, and repeated mock interviews.'],
                    ].map(([question, answer]) => (
                      <div key={question}>
                        <h3 className="text-lg font-semibold text-slate-900">{question}</h3>
                        <p className="mt-2 leading-7 text-slate-600">{answer}</p>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* About Instructor */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-4">About the Instructor</h2>
                <p className="text-slate-600 leading-relaxed">{course.instructorBio}</p>
              </motion.div>

              {/* Detailed Course Content */}
              {course.detailedContent && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8"
                >
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Course Overview</h2>
                  <div
                    className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed"
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
                className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                  <BookOpen className="w-6 h-6 mr-2 text-brand" />
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
                      className="rounded-lg bg-slate-50 border border-slate-200 p-4 hover:border-brand hover:bg-brand-soft/40 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="mt-1">
                            <CheckCircle className="w-5 h-5 text-brand" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-slate-900 font-semibold mb-1">{module.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-slate-500">
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
                  className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6"
                >
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Related Courses</h2>
                  <div className="space-y-4">
                    {relatedCourses.map((relatedCourse) => (
                      <Link key={relatedCourse.id} to={`/courses/${relatedCourse.slug || slugify(relatedCourse.name)}`}>
                        <div className="group rounded-lg overflow-hidden bg-white border border-slate-200 hover:border-brand hover:shadow-md transition-all duration-300">
                          <div className="relative h-32 overflow-hidden">
                            <img
                              src={optimizeImageUrl(relatedCourse.featuredImage, 200, 30)}
                              srcSet={generateImageSrcset(relatedCourse.featuredImage)}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                              alt={relatedCourse.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {/* Small save button on related courses for convenience */}
                             <div className="absolute top-2 right-2 z-10">
                              <SaveButton
                                courseId={relatedCourse.id}
                                className="w-8 h-8 p-1.5 bg-black/40 backdrop-blur-sm hover:bg-black/60"
                              />
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="text-slate-900 font-semibold mb-2 group-hover:text-brand transition-colors duration-300 line-clamp-2">
                              {relatedCourse.name}
                            </h3>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-brand font-bold">{relatedCourse.price}</span>
                              <div className="flex items-center text-slate-500">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-1" />
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
