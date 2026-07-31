import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, CheckCircle2, GraduationCap, Route, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import { optimizeImageUrl, generateImageSrcset } from '@/lib/utils';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { sanitizePath } from '@/lib/safeUrl';

const HomePage = () => {
  const { get } = useSiteSettings();

  // Hero copy + image (DB-backed, with hardcoded fallbacks)
  const heroBadge = get('home.hero.badge', 'System Design, made practical');
  const heroTitleLine1 = get('home.hero.title.line1', 'Understand System Design.');
  const heroTitleLine2 = get('home.hero.title.line2', 'Explain it with confidence.');
  const heroSubtitle = get(
    'home.hero.subtitle',
    'Build strong fundamentals with a clear tutorial path, practical architecture case studies, and an interview-focused course.'
  );
  const heroImageUrl = get(
    'home.hero.image',
    'https://images.unsplash.com/photo-1504983875-d3b163aba9e6'
  );
  const ctaPrimaryLabel = get('home.hero.cta_primary.label', 'Start with free tutorials');
  const ctaPrimaryPath = sanitizePath(get('home.hero.cta_primary.path', '/blog'), '/blog');
  const ctaSecondaryLabel = get('home.hero.cta_secondary.label', 'Explore the course');
  const ctaSecondaryPath = sanitizePath(get('home.hero.cta_secondary.path', '/courses'), '/courses');

  // Feature cards
  const blogFeatureTitle = get('home.feature.blog.title', 'Learn one concept at a time');
  const blogFeatureDesc = get(
    'home.feature.blog.description',
    'Follow the free System Design tutorial series from latency and throughput through databases, caching, and complete case studies.'
  );
  const coursesFeatureTitle = get('home.feature.courses.title', 'Learn with a guided course');
  const coursesFeatureDesc = get(
    'home.feature.courses.description',
    'Use a structured curriculum when you want a focused path, practical explanations, and preparation you can revisit before interviews.'
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
        <section className="relative overflow-hidden bg-gradient-to-b from-ink to-ink-2 pt-32 pb-16 lg:pt-40 lg:pb-24">
          {/* Background Image with Ink Overlay */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/[0.97] to-ink-2/[0.92] z-10" />
            <img
              src={optimizedHeroImage}
              srcSet={generateImageSrcset(heroImageUrl, true)}
              sizes="100vw"
              alt=""
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover opacity-35"
              onError={(e) => {
                // Fallback to original URL if optimized fails
                if (e.target.src !== heroImageUrl) {
                  e.target.src = heroImageUrl;
                }
              }}
            />
          </div>

          {/* Hero Content */}
          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]"
            >
              <div className="max-w-3xl">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mb-6 inline-flex items-center space-x-2 rounded-full border border-white/15 bg-white/10 px-4 py-2"
                >
                  <Sparkles className="w-4 h-4 text-lavender" />
                  <span className="text-sm font-medium text-slate-200">{heroBadge}</span>
                </motion.div>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05]">
                  {heroTitleLine1}
                  <span className="mt-2 block text-lavender">
                    {heroTitleLine2}
                  </span>
                </h1>

                <p className="mt-6 text-lg md:text-xl leading-relaxed text-slate-300 max-w-2xl">
                  {heroSubtitle}
                </p>

                <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <Link to={ctaPrimaryPath}>
                    <Button
                      size="lg"
                      className="group min-h-14 w-full bg-brand hover:bg-brand-dark text-white px-7 text-base font-semibold rounded-lg transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:w-auto"
                    >
                      <BookOpen className="w-5 h-5 mr-2" />
                      {ctaPrimaryLabel}
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </Link>

                  <Link to={ctaSecondaryPath}>
                  <Button
                    size="lg"
                      variant="outline"
                      className="group min-h-14 w-full border-white/25 bg-white/10 px-7 text-base font-semibold text-white hover:bg-white hover:text-ink rounded-lg transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:w-auto"
                  >
                    <GraduationCap className="w-5 h-5 mr-2" />
                      {ctaSecondaryLabel}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              </div>

                <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-lavender" />
                    Free beginner path
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-lavender" />
                    Interview case studies
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-lavender" />
                    Learn at your pace
                  </span>
                </div>
              </div>

              <aside
                aria-label="Recommended learning paths"
                className="rounded-2xl border border-white/15 bg-white/[0.08] p-3 shadow-2xl shadow-black/20 backdrop-blur-md sm:p-5"
              >
                <div className="px-3 pb-3 pt-2">
                  <p className="text-sm font-semibold uppercase tracking-wider text-lavender">Choose your next step</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Where should I begin?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">Pick the option that matches your goal right now.</p>
                </div>
                <div className="space-y-2">
                  <Link
                    to="/blog/understanding-latency-a-beginners-guide-to-system-design-fundamentals"
                    className="group flex min-h-20 items-center gap-4 rounded-xl border border-white/10 bg-white/[0.08] p-4 transition-colors hover:bg-white/[0.14]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavender font-bold text-ink">1</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">I’m new to System Design</span>
                      <span className="mt-1 block font-semibold text-white">Start with the fundamentals</span>
                    </span>
                    <ArrowRight className="h-5 w-5 shrink-0 text-lavender transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    to="/blog/designing-a-url-shortener-complete-system-design-case-study"
                    className="group flex min-h-20 items-center gap-4 rounded-xl border border-white/10 bg-white/[0.08] p-4 transition-colors hover:bg-white/[0.14]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavender font-bold text-ink">2</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">I know the basics</span>
                      <span className="mt-1 block font-semibold text-white">Practice a complete case study</span>
                    </span>
                    <ArrowRight className="h-5 w-5 shrink-0 text-lavender transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    to="/courses"
                    className="group flex min-h-20 items-center gap-4 rounded-xl border border-white/10 bg-white/[0.08] p-4 transition-colors hover:bg-white/[0.14]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white">3</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">I want a guided path</span>
                      <span className="mt-1 block font-semibold text-white">Explore the course curriculum</span>
                    </span>
                    <ArrowRight className="h-5 w-5 shrink-0 text-lavender transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </aside>
            </motion.div>
          </div>
        </section>

        <nav aria-label="Popular System Design topics" className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8">
            <span className="mr-2 shrink-0 text-sm font-semibold text-slate-500">Popular topics</span>
            <Link to="/blog/scalability-patterns-horizontal-vs-vertical-scaling" className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-brand-soft hover:text-brand">Scalability</Link>
            <Link to="/blog/load-balancing-distributing-traffic-across-servers" className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-brand-soft hover:text-brand">Load balancing</Link>
            <Link to="/blog/caching-strategies-improving-performance-with-smart-data-storage" className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-brand-soft hover:text-brand">Caching</Link>
            <Link to="/blog/database-design-replication-sharding-and-consistency" className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-brand-soft hover:text-brand">Databases</Link>
            <Link to="/blog/microservices-architecture-building-distributed-systems" className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-brand-soft hover:text-brand">Microservices</Link>
          </div>
        </nav>

        {/* Features Section */}
        <section className="py-20 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <p className="text-brand font-semibold text-sm uppercase tracking-wider mb-3">
                Learn your way
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
                Choose the level of structure you need
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                Explore freely when you have a specific question, or follow a guided path when you want momentum and accountability.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Blog Feature */}
              <Link to="/blog" className="group block rounded-2xl focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4">
                <div className="relative h-full overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 p-8 transition-all duration-300">
                  <div className="inline-flex bg-brand-soft rounded-xl p-3 mb-4">
                    <BookOpen className="w-8 h-8 text-brand" />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-brand">Free tutorials</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900 mb-3">{blogFeatureTitle}</h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    {blogFeatureDesc}
                  </p>
                  <span className="inline-flex items-center text-brand font-semibold">
                    Browse the tutorial series
                    <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </div>
              </Link>

              {/* Courses Feature */}
              <Link to="/courses" className="group block rounded-2xl focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4">
                <div className="relative h-full overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 p-8 transition-all duration-300">
                  <div className="inline-flex bg-brand-soft rounded-xl p-3 mb-4">
                    <GraduationCap className="w-8 h-8 text-brand" />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-brand">Focused curriculum</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900 mb-3">{coursesFeatureTitle}</h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    {coursesFeatureDesc}
                  </p>
                  <span className="inline-flex items-center text-brand font-semibold">
                    See course details
                    <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
              <div>
                <div className="inline-flex rounded-xl bg-brand-soft p-3">
                  <Route className="h-7 w-7 text-brand" />
                </div>
                <p className="mt-5 text-brand font-semibold text-sm uppercase tracking-wider">A calmer learning path</p>
                <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-slate-900">From “I’m lost” to a clear interview answer</h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-600">
                  Progress is easier when every step has one job. Start with the mental model, apply it to a real architecture, then practise explaining the trade-offs.
                </p>
              </div>
              <ol className="grid gap-4 sm:grid-cols-3">
                <li className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">01</span>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">Understand</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">Learn why a pattern exists before memorising how it works.</p>
                </li>
                <li className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">02</span>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">Apply</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">See the pattern inside realistic systems and case studies.</p>
                </li>
                <li className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">03</span>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">Explain</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">Practise the decisions and trade-offs interviewers listen for.</p>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Stats Band */}
        <section className="py-16 bg-ink">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-lavender">Course at a glance</p>
              <h2 className="mt-3 text-2xl font-bold text-white">A focused path you can finish</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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

        <section className="bg-brand-soft py-16">
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-brand">Start small</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">One clear concept is enough for today.</h2>
              <p className="mt-3 text-slate-600">Begin with the first tutorial and build the rest of the mental model step by step.</p>
            </div>
            <Link to="/blog/understanding-latency-a-beginners-guide-to-system-design-fundamentals" className="group inline-flex min-h-12 shrink-0 items-center rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
              Read the first tutorial
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

      </div>
    </>
  );
};

export default HomePage;
