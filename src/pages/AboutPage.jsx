import React from 'react';
import { ExternalLink, GraduationCap, Linkedin, Youtube } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';

const COURSE_URL =
  'https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73';

const AboutPage = () => (
  <>
    <SEOHead
      title="About Anand Rochlani — System Design Educator"
      description="Meet Anand Rochlani, Salesforce Member of Technical Staff and creator of practical System Design tutorials and an interview-focused Udemy course."
      canonical="https://anandrochlani.com/about"
      keywords="Anand Rochlani, system design educator, Salesforce engineer, system design course instructor"
    />
    <div className="min-h-screen bg-white pt-28 pb-20">
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">About the instructor</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Anand Rochlani
        </h1>
        <p className="mt-6 text-xl leading-8 text-slate-600">
          I’m a Member of Technical Staff at Salesforce and a System Design educator. I create
          practical lessons that help software engineers understand scalable architecture,
          explain trade-offs clearly, and prepare for System Design interviews.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ['5h 40m', 'Course content'],
            ['49', 'Video lectures'],
            ['4.8★', 'Udemy rating'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-3xl font-extrabold text-slate-900">{value}</p>
              <p className="mt-1 text-sm text-slate-600">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 space-y-8 text-lg leading-8 text-slate-600">
          <section>
            <h2 className="text-2xl font-bold text-slate-900">What I teach</h2>
            <p className="mt-3">
              The free tutorial series covers latency, throughput, load balancing, caching,
              replication, sharding, consistent hashing, and complete interview case studies.
              Each lesson starts with the problem, then explains the architecture and the
              trade-offs you should discuss with an interviewer.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-slate-900">About the course</h2>
            <p className="mt-3">
              System Design Fundamentals for Interviews is a beginner-friendly Udemy course
              with 8 sections, 49 lectures, and real case studies including a social
              bookmarking service, a coding contest platform, Facebook News Feed, and Google
              Typeahead. The course was last updated in February 2026.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-slate-900">Editorial approach</h2>
            <p className="mt-3">
              Articles are organized around one search question and reviewed for clear
              assumptions, accurate terminology, practical examples, and explicit trade-offs.
              Course links are identified as sponsored links. Published pages are updated when
              the course curriculum or a technical explanation materially changes.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <a href={COURSE_URL} target="_blank" rel="sponsored noopener noreferrer">
            <Button className="bg-brand text-white hover:bg-brand-dark">
              <GraduationCap className="mr-2 h-5 w-5" />
              View the Udemy course
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
          <a
            href="https://in.linkedin.com/in/anand-rochlani"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">
              <Linkedin className="mr-2 h-5 w-5" />
              LinkedIn
            </Button>
          </a>
          <a
            href="https://www.youtube.com/@anandrochlani5226"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">
              <Youtube className="mr-2 h-5 w-5" />
              YouTube
            </Button>
          </a>
        </div>
      </section>
    </div>
  </>
);

export default AboutPage;
