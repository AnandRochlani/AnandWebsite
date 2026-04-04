import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  Building2,
  Loader2,
  Briefcase,
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { fetchJobs, fetchCompanies, fetchCompanyById } from '@/data/jobsApi';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { parseSkillsParam, skillsToUrlParam } from '@/lib/jobsUi';
import JobListCard from '@/components/jobs/JobListCard';
import CompanyStripCard from '@/components/jobs/CompanyStripCard';
import JobPagination from '@/components/jobs/JobPagination';
import CompaniesModal from '@/components/jobs/CompaniesModal';

const DEBOUNCE_MS = 350;
const STRIP_LIMIT = 12;

function readJobsQuery(searchParams) {
  const companyId = searchParams.get('company_id');
  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20') || 20));
  return {
    q: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    company: companyId ? '' : searchParams.get('company') || '',
    company_id: companyId || undefined,
    min_exp: searchParams.get('min_exp') || '',
    max_exp: searchParams.get('max_exp') || '',
    skills: parseSkillsParam(searchParams.get('skills') || ''),
    page,
    limit,
  };
}

export default function JobsPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const navKeyRef = useRef(location.key);

  const qUrl = searchParams.get('q') || '';
  const locationUrl = searchParams.get('location') || '';
  const companyUrl = searchParams.get('company') || '';
  const skillsUrl = searchParams.get('skills') || '';

  const [qInput, setQInput] = useState(() => qUrl);
  const [locationInput, setLocationInput] = useState(() => locationUrl);
  const [companyInput, setCompanyInput] = useState(() => companyUrl);
  const [skillsInput, setSkillsInput] = useState(() => skillsUrl);

  const debouncedQ = useDebouncedValue(qInput, DEBOUNCE_MS);
  const debouncedLocation = useDebouncedValue(locationInput, DEBOUNCE_MS);
  const debouncedCompany = useDebouncedValue(companyInput, DEBOUNCE_MS);
  const debouncedSkills = useDebouncedValue(skillsInput, DEBOUNCE_MS);

  // Sync inputs from URL only on real navigation (back/forward, new entry), not when we debounce-update the same view.
  useEffect(() => {
    if (location.key === navKeyRef.current) return;
    navKeyRef.current = location.key;
    setQInput(searchParams.get('q') || '');
    setLocationInput(searchParams.get('location') || '');
    setCompanyInput(searchParams.get('company') || '');
    setSkillsInput(searchParams.get('skills') || '');
  }, [location.key, searchParams]);

  const flushToUrl = useCallback(
    (updates, resetPage = true) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
              p.delete(key);
            } else {
              p.set(key, String(value));
            }
          });
          if (resetPage) p.set('page', '1');
          return p;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (debouncedQ === qUrl) return;
    flushToUrl({ q: debouncedQ }, true);
  }, [debouncedQ, qUrl, flushToUrl]);

  useEffect(() => {
    if (debouncedLocation === locationUrl) return;
    flushToUrl({ location: debouncedLocation }, true);
  }, [debouncedLocation, locationUrl, flushToUrl]);

  useEffect(() => {
    if (debouncedCompany === companyUrl) return;
    flushToUrl({ company: debouncedCompany }, true);
  }, [debouncedCompany, companyUrl, flushToUrl]);

  useEffect(() => {
    if (debouncedSkills === skillsUrl) return;
    flushToUrl({ skills: debouncedSkills }, true);
  }, [debouncedSkills, skillsUrl, flushToUrl]);

  const [jobsState, setJobsState] = useState({
    data: [],
    total: 0,
    page: 1,
    limit: 20,
    loading: true,
    error: null,
  });

  const [strip, setStrip] = useState({ data: [], loading: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCompanyName, setSelectedCompanyName] = useState('');

  const companyIdStr = searchParams.get('company_id');

  useEffect(() => {
    let cancelled = false;
    if (!companyIdStr) {
      setSelectedCompanyName('');
      return;
    }
    fetchCompanyById(companyIdStr)
      .then((c) => {
        if (!cancelled) setSelectedCompanyName(c?.name || '');
      })
      .catch(() => {
        if (!cancelled) setSelectedCompanyName('');
      });
    return () => {
      cancelled = true;
    };
  }, [companyIdStr]);

  useEffect(() => {
    let mounted = true;
    const query = readJobsQuery(searchParams);
    setJobsState((s) => ({ ...s, loading: true, error: null }));
    fetchJobs(query)
      .then((res) => {
        if (!mounted) return;
        setJobsState({
          data: res.data,
          total: res.total,
          page: res.page,
          limit: res.limit,
          loading: false,
          error: null,
        });
      })
      .catch((e) => {
        if (!mounted) return;
        setJobsState((s) => ({
          ...s,
          data: [],
          total: 0,
          loading: false,
          error: e?.message || 'Failed to load jobs',
        }));
        toast({
          title: 'Could not load jobs',
          description: e?.message || 'Please try again later.',
          variant: 'destructive',
        });
      });
    return () => {
      mounted = false;
    };
  }, [searchParams.toString(), toast]);

  useEffect(() => {
    let mounted = true;
    fetchCompanies({ page: 1, limit: STRIP_LIMIT })
      .then((res) => {
        if (mounted) setStrip({ data: res.data, loading: false });
      })
      .catch(() => {
        if (mounted) setStrip({ data: [], loading: false });
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleReset = () => {
    setQInput('');
    setLocationInput('');
    setCompanyInput('');
    setSkillsInput('');
    setSearchParams({}, { replace: true });
  };

  const handleSelectCompany = (id, name) => {
    setSelectedCompanyName(name || '');
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set('company_id', String(id));
        p.delete('company');
        p.set('page', '1');
        return p;
      },
      { replace: true }
    );
  };

  const clearCompanyFilter = () => {
    setSelectedCompanyName('');
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete('company_id');
        p.set('page', '1');
        return p;
      },
      { replace: true }
    );
  };

  const onPageChange = (nextPage) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set('page', String(nextPage));
        return p;
      },
      { replace: true }
    );
  };

  const minExpVal = searchParams.get('min_exp') || '';
  const maxExpVal = searchParams.get('max_exp') || '';
  const limitVal = String(
    Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20') || 20))
  );

  const selectedCompanyId = companyIdStr ? Number(companyIdStr) : null;

  return (
    <>
      <SEOHead
        title="Job openings"
        description="Browse curated job openings from leading technology companies. Roles are with third-party employers; apply on their official sites."
        keywords="tech jobs, software engineer jobs, developer careers, remote jobs, job board"
        canonical="https://www.anandrochlani.com/jobs"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Open{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                roles
              </span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-2">
              Opportunities at partner companies—aggregated for discovery. AnandRochlani does not
              employ these roles; apply through each employer&apos;s official application link.
            </p>
          </motion.div>

          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-8 space-y-8 mb-10 lg:mb-0">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">Filters</span>
                  {selectedCompanyId ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-sm border border-purple-500/30">
                      {selectedCompanyName || `Company #${selectedCompanyId}`}
                      <button
                        type="button"
                        onClick={clearCompanyFilter}
                        className="p-0.5 rounded hover:bg-white/10"
                        aria-label="Clear company filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="ml-auto border-white/20 bg-white/5 text-gray-300 hover:bg-white/10 text-sm h-9"
                  >
                    Reset
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={qInput}
                    onChange={(e) => setQInput(e.target.value)}
                    placeholder="Search title or description..."
                    className="w-full pl-11 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Location"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {!selectedCompanyId ? (
                    <input
                      type="text"
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                      placeholder="Company name"
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <div className="hidden sm:block" aria-hidden />
                  )}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    type="number"
                    min={0}
                    value={minExpVal}
                    onChange={(e) =>
                      flushToUrl({ min_exp: e.target.value }, true)
                    }
                    placeholder="Min years exp."
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    min={0}
                    value={maxExpVal}
                    onChange={(e) =>
                      flushToUrl({ max_exp: e.target.value }, true)
                    }
                    placeholder="Max years exp."
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="Skills (comma-separated, e.g. go, python)"
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm text-gray-400 flex items-center gap-2">
                    Per page
                    <select
                      value={limitVal}
                      onChange={(e) => flushToUrl({ limit: e.target.value }, true)}
                      className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                    >
                      {[20, 50, 100].map((n) => (
                        <option key={n} value={n} className="bg-slate-900">
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </motion.div>

              {jobsState.loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                </div>
              ) : jobsState.error ? (
                <p className="text-center text-red-400 py-12">{jobsState.error}</p>
              ) : jobsState.data.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-white/10 bg-white/[0.02]">
                  <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-300 mb-2">No roles match these filters.</p>
                  <Button
                    type="button"
                    onClick={handleReset}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-gray-400 text-sm">
                    Showing{' '}
                    <span className="text-white font-medium">{jobsState.data.length}</span> of{' '}
                    <span className="text-white font-medium">{jobsState.total}</span> roles
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {jobsState.data.map((job, index) => (
                      <JobListCard key={job.id} job={job} index={index} />
                    ))}
                  </div>
                  <JobPagination
                    page={jobsState.page}
                    limit={jobsState.limit}
                    total={jobsState.total}
                    onPageChange={onPageChange}
                    disabled={jobsState.loading}
                  />
                </>
              )}
            </div>

            <aside className="lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="lg:sticky lg:top-24"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">Browse by company</h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Select a company to filter the list. Names and openings are sourced from public
                  career pages.
                </p>

                {strip.loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                  </div>
                ) : (
                  <div className="flex lg:flex-col gap-3 overflow-x-auto pb-2 lg:overflow-visible lg:pb-0 -mx-1 px-1">
                    {strip.data.map((c, index) => (
                      <div key={c.id} className="flex-shrink-0 w-[min(280px,85vw)] lg:w-auto">
                        <CompanyStripCard
                          company={c}
                          selected={selectedCompanyId === c.id}
                          onSelect={handleSelectCompany}
                          index={index}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(true)}
                  className="w-full mt-4 border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  See more companies
                </Button>
              </motion.div>
            </aside>
          </div>
        </div>
      </div>

      <CompaniesModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onPickCompany={handleSelectCompany}
      />
    </>
  );
}
