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
          type="website"
          noindex
        />
      ) : (
        <SEOHead
          title="Job details"
          description="View role details and apply on the employer site."
          noindex
        />
      )}

      <div className="min-h-screen bg-slate-50 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(backTo)}
            className="mb-8 border-slate-300 bg-white text-slate-700 hover:border-brand hover:text-brand"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to jobs
          </Button>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-10 h-10 text-brand animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-16 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <p className="text-red-500 mb-4">{error}</p>
              <Link to="/jobs">
                <Button className="bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg">
                  Browse all jobs
                </Button>
              </Link>
            </div>
          ) : job ? (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-brand" />
                      {job.company_name}
                    </span>
                    {job.location ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-brand" />
                        {job.location}
                      </span>
                    ) : null}
                    {exp ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-brand" />
                        {exp}
                      </span>
                    ) : null}
                    {job.job_type ? (
                      <span className="text-sm px-3 py-0.5 rounded-full bg-brand-soft text-brand font-semibold">{job.job_type}</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-8">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-full bg-brand-soft text-brand text-sm font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : null}

              {descriptionSource ? (
                <div className="mb-10">
                  <h2 className="text-lg font-semibold text-slate-900 mb-3">Description</h2>
                  {descriptionIsHtml ? (
                    <div
                      className="blog-content text-slate-600 leading-relaxed"
                      // eslint-disable-next-line react/no-danger -- sanitized with DOMPurify
                      dangerouslySetInnerHTML={{
                        __html: sanitizeJobHtml(descriptionSource),
                      }}
                    />
                  ) : (
                    <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {descriptionSource}
                    </div>
                  )}
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                {job.apply_url ? (
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg text-base font-semibold px-8 py-3 w-full sm:w-auto bg-brand hover:bg-brand-dark text-white shadow-sm hover:shadow-md transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
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
                      className="w-full sm:w-auto border-slate-300 bg-white text-slate-700 hover:border-brand hover:text-brand"
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
