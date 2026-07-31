import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import { optimizeImageUrl, generateImageSrcset } from '@/lib/utils';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { sanitizePath } from '@/lib/safeUrl';

const HomePage = () => {
  const { get } = useSiteSettings();

  // Hero copy + image (DB-backed, with hardcoded fallbacks)
  const heroBadge = get('home.hero.badge', 'Learn. Build. Grow.');
  const heroTitleLine1 = get('home.hero.title.line1', 'Courses &');
  const heroTitleLine2 = get('home.hero.title.line2', 'Tech Blog');
  const heroSubtitle = get(
    'home.hero.subtitle',
    'Explore courses and blog posts on web development, design, data science, and system design—written for real-world learning and interview prep.'
  );
  const heroImageUrl = get(
    'home.hero.image',
    'https://images.unsplash.com/photo-1504983875-d3b163aba9e6'
  );
  const ctaPrimaryLabel = get('home.hero.cta_primary.label', 'View Courses');
  const ctaPrimaryPath = sanitizePath(get('home.hero.cta_primary.path', '/courses'), '/courses');
  const ctaSecondaryLabel = get('home.hero.cta_secondary.label', 'View Blog');
  const ctaSecondaryPath = sanitizePath(get('home.hero.cta_secondary.path', '/blog'), '/blog');

  // Feature cards
  const blogFeatureTitle = get('home.feature.blog.title', 'Insightful Blog Posts');
  const blogFeatureDesc = get(
    'home.feature.blog.description',
    'Stay updated with the latest trends, tutorials, and best practices in technology and design.'
  );
  const coursesFeatureTitle = get('home.feature.courses.title', 'Curated Courses');
  const coursesFeatureDesc = get(
    'home.feature.courses.description',
    'Learn with structured courses across Web Development, Design, Data Science, and System Design—built to help you ship projects and level up fast.'
  );

  // Use 200px for fastest mobile LCP (base image)
  // Desktop will use larger images from srcset (400px, 800px, 1200px, 1600px)
  // Quality increases with size: mobile=35%, desktop=50-70% for better quality
  const optimizedHeroImage = optimizeImageUrl(heroImageUrl, 200, 35);

  // Preload hero image for better LCP (immediate, not deferred)
  useEffect(() => {
    // Check if already preloaded in HTML
    const existingPreload = document.querySelector(`link[rel="preload"][href="${optimizedHeroImage}"]`);
    if (!existingPreload) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedHeroImage;
      link.fetchPriority = 'high';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }, [optimizedHeroImage]);

  return (
    <>
      <SEOHead 
        title="System Design Tutorials & Courses"
        description="Free System Design tutorials for interview prep — caching, sharding, consistent hashing, load balancing and full case studies."
        keywords="system design, system design interview, system design tutorial, software architecture, scalability, distributed systems"
        canonical="https://anandrochlani.com/"
      />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-ink to-ink-2">
          {/* Background Image with Ink Overlay */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-ink/[0.97] via-ink/[0.96] to-ink-2/[0.97] z-10" />
            <img
              src={optimizedHeroImage}
              srcSet={generateImageSrcset(heroImageUrl, true)}
              sizes="100vw"
              alt="Learning Background"
              fetchpriority="high"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to original URL if optimized fails
                if (e.target.src !== heroImageUrl) {
                  e.target.src = heroImageUrl;
                }
              }}
            />
          </div>

          {/* Hero Content */}
          <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 border border-white/15"
              >
                <Sparkles className="w-4 h-4 text-lavender" />
                <span className="text-sm text-slate-200">{heroBadge}</span>
              </motion.div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
                {heroTitleLine1}
                <span className="block text-lavender">
                  {heroTitleLine2}
                </span>
              </h1>

              <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
                {heroSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <a
                  href="https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    className="group bg-brand hover:bg-brand-dark text-white px-8 py-6 text-lg font-semibold rounded-lg transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Get the Course
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </a>

                <Link to={ctaPrimaryPath}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="group bg-white text-ink border-transparent hover:bg-slate-100 hover:text-ink px-8 py-6 text-lg font-semibold rounded-lg transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    {ctaPrimaryLabel}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>

                <Link
                  to={ctaSecondaryPath}
                  className="group inline-flex items-center text-slate-300 hover:text-white text-lg font-medium transition-colors duration-300"
                >
                  {ctaSecondaryLabel}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>

              {/* Topic pills */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
                {['System Design', 'Consistent Hashing', 'News Feed Design', 'Caching', 'Load Balancing'].map((topic) => (
                  <Link
                    key={topic}
                    to="/blog"
                    className="rounded-full bg-white/10 border border-white/15 text-slate-200 hover:bg-white/20 text-sm px-4 py-1.5 transition-colors duration-300"
                  >
                    {topic}
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
            >
              <motion.div className="w-1.5 h-1.5 rounded-full bg-white" />
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-brand font-semibold text-sm uppercase tracking-wider mb-3">
                Start Learning
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
                Everything you need to level up
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Blog Feature */}
              <Link to="/blog">
                <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 p-8 transition-all duration-300">
                  <div className="inline-flex bg-brand-soft rounded-xl p-3 mb-4">
                    <BookOpen className="w-8 h-8 text-brand" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">{blogFeatureTitle}</h2>
                  <p className="text-slate-600 mb-4">
                    {blogFeatureDesc}
                  </p>
                  <span className="inline-flex items-center text-brand font-medium group-hover:gap-2 transition-all duration-300">
                    View Blog Posts
                    <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </div>
              </Link>

              {/* Courses Feature */}
              <Link to="/courses">
                <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 p-8 transition-all duration-300">
                  <div className="inline-flex bg-brand-soft rounded-xl p-3 mb-4">
                    <GraduationCap className="w-8 h-8 text-brand" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">{coursesFeatureTitle}</h2>
                  <p className="text-slate-600 mb-4">
                    {coursesFeatureDesc}
                  </p>
                  <span className="inline-flex items-center text-brand font-medium group-hover:gap-2 transition-all duration-300">
                    View Courses
                    <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Band */}
        <section className="py-16 bg-ink">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl md:text-5xl font-extrabold text-white">350+</p>
                <p className="mt-2 text-slate-300">Students</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-extrabold text-white">4.8&#9733;</p>
                <p className="mt-2 text-slate-300">Course Rating</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-extrabold text-white">49</p>
                <p className="mt-2 text-slate-300">Lectures</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-extrabold text-white">5.5</p>
                <p className="mt-2 text-slate-300">Hours of Content</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
};

export default HomePage;