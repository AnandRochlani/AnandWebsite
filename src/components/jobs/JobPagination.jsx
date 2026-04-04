import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function JobPagination({ page, limit, total, onPageChange, disabled }) {
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
      <p className="text-sm text-gray-400">
        Page <span className="text-white font-medium">{page}</span> of{' '}
        <span className="text-white font-medium">{totalPages}</span>
        <span className="text-gray-500"> · {total} roles</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !canPrev}
          onClick={() => onPageChange(page - 1)}
          className="border-white/20 bg-white/5 text-white hover:bg-white/10 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !canNext}
          onClick={() => onPageChange(page + 1)}
          className="border-white/20 bg-white/5 text-white hover:bg-white/10 disabled:opacity-40"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
