import React from 'react';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';

const cases = [
  ['Design a URL Shortener', 'Requirements, capacity estimates, Base62 IDs, caching, replication, and sharding.', '/blog/designing-a-url-shortener-complete-system-design-case-study', 'Read-heavy lookup service'],
  ['Design a Social Bookmarking Service', 'A del.icio.us-style design with tags, cache partitioning, and growth bottlenecks.', '/blog/design-a-social-bookmarking-service-delicious-system-design-case-study', 'Cache and data partitioning'],
  ['Design a Coding Contest Platform', 'Sandboxed judge workers, queues, traffic spikes, and a real-time leaderboard.', '/blog/design-a-coding-contest-platform-leetcode-system-design-interview', 'Bursty asynchronous workloads'],
  ['Design Facebook News Feed', 'Fanout on write versus fanout on read, feed caches, hot users, and ranking.', '/blog/design-facebook-news-feed-system-design-interview-guide', 'High-scale feed generation'],
  ['Design Google Typeahead', 'Tries, top-k suggestions, offline aggregation, caching, and a sub-100 ms budget.', '/blog/design-google-typeahead-autocomplete-system-design-interview', 'Low-latency prefix search'],
];

const SystemDesignCaseStudiesPage = () => (
  <>
    <SEOHead
      title="System Design Case Studies for Interviews"
      description="Practice five complete System Design case studies covering requirements, estimates, APIs, architecture, bottlenecks, and interview trade-offs."
      canonical="https://anandrochlani.com/system-design-case-studies"
      keywords="system design case studies, system design interview questions, system design examples"
    />
    <div className="min-h-screen bg-white pt-28 pb-20">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">Practice library</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">System Design Case Studies for Interviews</h1>
        <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-600">Work through these designs in order. Each one turns requirements and scale into a complete architecture, then examines the trade-offs interviewers usually probe.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {cases.map(([title, description, path, focus], index) => (
            <Link key={path} to={path} className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-xl">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">{index + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-brand">{focus}</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900 group-hover:text-brand">{title}</h2>
                  <p className="mt-3 leading-7 text-slate-600">{description}</p>
                  <span className="mt-5 inline-flex items-center font-semibold text-brand">Study the design <ArrowRight className="ml-2 h-4 w-4" /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <section className="mt-14 rounded-3xl bg-ink p-8 text-white sm:p-10">
          <BookOpen className="h-9 w-9 text-lavender" />
          <h2 className="mt-4 text-3xl font-bold">Use one repeatable method</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {['Clarify scope and non-functional requirements.', 'Estimate peak QPS, storage, bandwidth, and the hot set.', 'Define APIs, entities, and access patterns.', 'Walk the primary read and write paths.', 'Find the first bottleneck and explain failure handling.', 'Close with the biggest trade-off and next scaling step.'].map((step) => (
              <p key={step} className="flex gap-3 text-slate-200"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-lavender" />{step}</p>
            ))}
          </div>
          <Link to="/blog/system-design-interview-framework-step-by-step-2026" className="mt-8 inline-flex items-center rounded-lg bg-white px-5 py-3 font-semibold text-ink">Learn the interview framework <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </section>
      </section>
    </div>
  </>
);

export default SystemDesignCaseStudiesPage;
