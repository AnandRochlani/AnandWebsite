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
      className={`w-full text-left rounded-xl border p-4 transition-all duration-300 ${
        selected
          ? 'border-purple-500/70 bg-gradient-to-br from-purple-500/20 to-pink-500/10 shadow-lg shadow-purple-500/10 ring-1 ring-purple-400/40'
          : 'border-white/10 bg-gradient-to-br from-white/5 to-transparent hover:border-purple-500/40 hover:bg-white/[0.07]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="font-semibold text-white truncate">{company.name}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{company.name}</p>
          <p className="text-sm text-gray-400 mt-2 leading-snug">
            Find current openings we track for this company.
          </p>
        </div>
      </div>
    </motion.button>
  );
}
