import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, ArrowRight } from 'lucide-react';
import { formatExperience } from '@/lib/jobsUi';
import { getJobDescriptionDisplay, stripHtmlForPreview } from '@/lib/jobDescription';

const cardClass =
  'group block h-full rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-5';

export default function JobListCard({ job, index = 0 }) {
  const location = useLocation();
  const exp = formatExperience(job);
  const { source: descSource } = getJobDescriptionDisplay(job);
  const preview = descSource ? stripHtmlForPreview(descSource) : '';
  const skills = Array.isArray(job.skills) ? job.skills : [];
  const visibleSkills = skills.slice(0, 5);
  const more = skills.length - visibleSkills.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.04 }}
    >
      <Link
        to={`/jobs/${job.id}`}
        state={{ fromJobs: `${location.pathname}${location.search}` }}
        className={cardClass}
      >
        <div className="flex flex-col h-full min-h-[140px]">
          <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-brand transition-colors line-clamp-2">
            {job.title}
          </h3>
          <p className="text-sm text-brand font-medium mb-2">{job.company_name}</p>

          {preview ? (
            <p className="text-slate-600 text-sm mb-3 line-clamp-2 flex-shrink-0">{preview}</p>
          ) : (
            <p className="text-slate-500 text-sm mb-3 line-clamp-2 flex-shrink-0">
              {job.location || 'Location not specified'}
              {exp ? ` · ${exp}` : ''}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
            {job.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand" />
                <span className="line-clamp-1">{job.location}</span>
              </span>
            ) : null}
            {exp ? (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-brand" />
                {exp}
              </span>
            ) : null}
          </div>

          {visibleSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {visibleSkills.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-full bg-brand-soft text-brand text-xs font-semibold"
                >
                  {s}
                </span>
              ))}
              {more > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">
                  +{more}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-auto flex items-center text-sm font-medium text-brand group-hover:text-brand-dark">
            View details
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
