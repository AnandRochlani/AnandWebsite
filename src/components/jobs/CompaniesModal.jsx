import React, { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { fetchCompanies } from '@/data/jobsApi';
import { Button } from '@/components/ui/button';

export default function CompaniesModal({ open, onOpenChange, onPickCompany }) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ data: [], total: 0 });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    setPage(1);
  }, [open, debouncedQ]);

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCompanies({ q: debouncedQ, page, limit });
      setData(res);
    } catch (e) {
      setError(e?.message || 'Failed to load companies');
      setData({ data: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [open, debouncedQ, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(data.total / limit) || 1);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[min(100vw-2rem,520px)] max-h-[min(85vh,640px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-slate-900 shadow-2xl flex flex-col outline-none">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <Dialog.Title className="text-lg font-semibold text-white">
              All companies
            </Dialog.Title>
            <Dialog.Close
              type="button"
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Search and select a company to filter job listings.
          </Dialog.Description>

          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by company name..."
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[200px] p-2">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : error ? (
              <p className="text-center text-red-400 py-8 px-4">{error}</p>
            ) : data.data.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No companies found.</p>
            ) : (
              <ul className="space-y-1">
                {data.data.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onPickCompany(c.id, c.name);
                        onOpenChange(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors"
                    >
                      <span className="font-medium">{c.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between p-4 border-t border-white/10 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-400">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
