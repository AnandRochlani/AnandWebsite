import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  ExternalLink,
  Building2,
  Loader2,
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { fetchJobById } from '@/data/jobsApi';
import { formatExperience } from '@/lib/jobsUi';
import {
  getJobDescriptionDisplay,
  sanitizeJobHtml,
  stripHtmlForPreview,
} from '@/lib/jobDescription';
import { useToast } from '@/components/ui/use-toast';

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const backTo = location.state?.fromJobs || '/jobs';

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!id) {
      setLoading(false);
      setError('Missing job id');
      return;
    }
    setLoading(true);
    setError(null);
    fetchJobById(id)
      .then((data) => {
        if (!mounted) return;
        if (!data || data.id == null) {
          setError('Job not found');
          setJob(null);
        } else {
          setJob(data);
        }
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || 'Failed to load job');
        setJob(null);
        toast({
          title: 'Could not load job',
          description: e?.message || 'Please try again.',
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id, toast]);

  const exp = job ? formatExperience(job) : null;
  const skills = job && Array.isArray(job.skills) ? job.skills : [];
  const { source: descriptionSource, isHtml: descriptionIsHtml } = job
    ? getJobDescriptionDisplay(job)
    : { source: '', isHtml: false };
  const seoPlain = descriptionSource ? stripHtmlForPreview(descriptionSource) : '';

  return (
    <>
      {job ? (
        <SEOHead
          title={job.title}
          description={
            seoPlain
              ? seoPlain.slice(0, 155) + (seoPlain.length > 155 ? '…' : '')
              : `${job.title} at ${job.company_name || 'company'}`
          }
          canonical={`https://www.anandrochlani.com/jobs/${job.id}`}
          type="website"
        />
      ) : (
        <SEOHead
          title="Job details"
          description="View role details and apply on the employer site."
          canonical={`https://www.anandrochlani.com/jobs/${id || ''}`}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(backTo)}
            className="mb-8 border-white/20 bg-white/5 text-gray-200 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to jobs
          </Button>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-16 rounded-xl border border-white/10 bg-white/[0.02]">
              <p className="text-red-400 mb-4">{error}</p>
              <Link to="/jobs">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  Browse all jobs
                </Button>
              </Link>
            </div>
          ) : job ? (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-6 sm:p-8 shadow-xl"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-gray-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      {job.company_name}
                    </span>
                    {job.location ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-pink-400" />
                        {job.location}
                      </span>
                    ) : null}
                    {exp ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-purple-300" />
                        {exp}
                      </span>
                    ) : null}
                    {job.job_type ? (
                      <span className="text-sm px-2 py-0.5 rounded-full bg-white/10">{job.job_type}</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-8">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-full bg-white/10 text-gray-200 text-sm border border-white/10"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : null}

              {descriptionSource ? (
                <div className="mb-10">
                  <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
                  {descriptionIsHtml ? (
                    <div
                      className="blog-content text-gray-300 leading-relaxed"
                      // eslint-disable-next-line react/no-danger -- sanitized with DOMPurify
                      dangerouslySetInnerHTML={{
                        __html: sanitizeJobHtml(descriptionSource),
                      }}
                    />
                  ) : (
                    <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {descriptionSource}
                    </div>
                  )}
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                {job.apply_url ? (
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl text-base font-semibold px-8 py-3 w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-purple-500/30 transition-all"
                  >
                    Apply for this role
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                ) : null}
                {job.company_id ? (
                  <Link to={`/jobs?company_id=${job.company_id}`} className="inline-flex">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      More jobs at {job.company_name || 'this company'}
                    </Button>
                  </Link>
                ) : null}
              </div>
            </motion.article>
          ) : null}
        </div>
      </div>
    </>
  );
}
