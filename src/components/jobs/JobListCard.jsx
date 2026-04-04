import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, ArrowRight } from 'lucide-react';
import { formatExperience } from '@/lib/jobsUi';
import { getJobDescriptionDisplay, stripHtmlForPreview } from '@/lib/jobDescription';

const cardClass =
  'group block h-full rounded-xl overflow-hidden bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 p-5';

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
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors line-clamp-2">
            {job.title}
          </h3>
          <p className="text-sm text-purple-300/90 mb-2">{job.company_name}</p>

          {preview ? (
            <p className="text-gray-400 text-sm mb-3 line-clamp-2 flex-shrink-0">{preview}</p>
          ) : (
            <p className="text-gray-500 text-sm mb-3 line-clamp-2 flex-shrink-0">
              {job.location || 'Location not specified'}
              {exp ? ` · ${exp}` : ''}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
            {job.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span className="line-clamp-1">{job.location}</span>
              </span>
            ) : null}
            {exp ? (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-pink-400" />
                {exp}
              </span>
            ) : null}
          </div>

          {visibleSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {visibleSkills.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-full bg-white/10 text-gray-300 text-xs"
                >
                  {s}
                </span>
              ))}
              {more > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-500 text-xs">
                  +{more}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-auto flex items-center text-sm font-medium text-purple-400 group-hover:text-pink-400">
            View details
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
