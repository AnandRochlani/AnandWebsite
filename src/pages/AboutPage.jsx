import React from 'react';
import { ExternalLink, GraduationCap, Linkedin, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';

const COURSE_URL =
  'https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73';

const AboutPage = () => (
  <>
    <SEOHead
      title="About Anand Rochlani"
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
          recognise reusable coding patterns, explain trade-offs clearly, and prepare for technical interviews.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['3', 'Interview courses'],
            ['2', 'Interview tracks'],
            ['49', 'Published lectures'],
            ['4.8★', 'Published course rating'],
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
              The free library covers latency, throughput, load balancing, caching,
              replication, sharding, complete architecture case studies, and the reusable
              patterns behind coding interview problems. Each lesson starts with the problem,
              then explains the reasoning and trade-offs you should communicate to an interviewer.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-slate-900">About the courses</h2>
            <p className="mt-3">
              System Design Fundamentals for Interviews is the published Udemy course, with
              8 sections, 49 lectures, and complete architecture case studies. Two coding
              interview curricula are currently in production: an Amazon-focused 15-pattern
              path and a Google-focused 50-problem path. Their full outlines are available so
              learners can evaluate the scope before launch.
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

        <section className="mt-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Choose a track</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Link to="/courses/system-design-fundamental" className="group rounded-2xl border border-slate-200 p-6 hover:border-brand hover:shadow-lg">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Available now</span>
              <h2 className="mt-2 text-xl font-bold text-slate-900 group-hover:text-brand">System Design fundamentals</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Architecture building blocks and complete interview case studies.</p>
            </Link>
            <Link to="/courses/amazon-coding-interview-patterns" className="group rounded-2xl border border-slate-200 p-6 hover:border-brand hover:shadow-lg">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">In production</span>
              <h2 className="mt-2 text-xl font-bold text-slate-900 group-hover:text-brand">Amazon coding patterns</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Fifteen reusable patterns, mock interviews, and leadership preparation.</p>
            </Link>
            <Link to="/courses/google-coding-interview-50-problems" className="group rounded-2xl border border-slate-200 p-6 hover:border-brand hover:shadow-lg">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">In production</span>
              <h2 className="mt-2 text-xl font-bold text-slate-900 group-hover:text-brand">Google 50-problem path</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Google-tagged problems organised by pattern and interview signal.</p>
            </Link>
          </div>
        </section>

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
