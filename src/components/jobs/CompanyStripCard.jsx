import React from 'react';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { companyInitials } from '@/lib/jobsUi';

export default function CompanyStripCard({
  company,
  selected,
  onSelect,
  index = 0,
}) {
  const initials = companyInitials(company.name);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={() => onSelect(company.id, company.name)}
      aria-current={selected ? 'true' : undefined}
      className={`w-full text-left rounded-2xl border p-4 transition-all duration-300 ${
        selected
          ? 'border-brand bg-brand-soft shadow-sm ring-1 ring-brand/40'
          : 'border-slate-200 bg-white shadow-sm hover:border-brand/40 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-brand flex items-center justify-center text-white text-sm font-bold">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-brand flex-shrink-0" />
            <span className="font-semibold text-slate-900 truncate">{company.name}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{company.name}</p>
          <p className="text-sm text-slate-500 mt-2 leading-snug">
            Find current openings we track for this company.
          </p>
        </div>
      </div>
    </motion.button>
  );
}
