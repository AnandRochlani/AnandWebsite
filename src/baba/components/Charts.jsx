import React from 'react';
import { formatMoney } from '@/baba/format';

// A small, brand-coherent categorical palette (accessible on white).
export const PALETTE = ['#0d9488', '#2563eb', '#7c3aed', '#f59e0b', '#e11d48', '#0891b2', '#65a30d'];

// -------------------------------------------------------------- KPI stat tile
export function StatCard({ icon: Icon, label, value, sub, tone = 'teal' }) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-0.5 truncate text-xl font-bold text-slate-900">{value}</p>
          {sub && <p className="truncate text-xs text-slate-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------ Grouped vertical bars
// data: [{ label, a, b }]  — a = revenue, b = collected
export function GroupedBarChart({ data, seriesA = 'Revenue', seriesB = 'Collected', money = true }) {
  if (!data || data.length === 0) return <ChartEmpty />;
  const max = Math.max(1, ...data.map((d) => Math.max(d.a || 0, d.b || 0)));
  const fmt = money ? (v) => formatMoney(v) : (v) => v;

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-slate-500">
        <Legend color={PALETTE[0]} label={seriesA} />
        <Legend color={PALETTE[1]} label={seriesB} />
      </div>
      <div className="flex items-end gap-3 overflow-x-auto pb-1" style={{ minHeight: 160 }}>
        {data.map((d, i) => (
          <div key={i} className="flex min-w-[44px] flex-1 flex-col items-center gap-1">
            <div className="flex h-36 w-full items-end justify-center gap-1">
              <Bar height={((d.a || 0) / max) * 100} color={PALETTE[0]} title={`${seriesA}: ${fmt(d.a)}`} />
              <Bar height={((d.b || 0) / max) * 100} color={PALETTE[1]} title={`${seriesB}: ${fmt(d.b)}`} />
            </div>
            <span className="whitespace-nowrap text-[11px] font-medium text-slate-500">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({ height, color, title }) {
  return (
    <div className="group relative flex w-4 items-end sm:w-5" style={{ height: '100%' }} title={title}>
      <div
        className="w-full rounded-t transition-all"
        style={{ height: `${Math.max(2, height)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// -------------------------------------------------------------- Line / area
export function LineChart({ data, money = true }) {
  if (!data || data.length === 0) return <ChartEmpty />;
  const W = 640;
  const H = 180;
  const pad = 8;
  const max = Math.max(1, ...data.map((d) => d.value || 0));
  const step = data.length > 1 ? (W - pad * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = pad + i * step;
    const y = H - pad - ((d.value || 0) / max) * (H - pad * 2);
    return [x, y];
  });
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${H - pad} L${points[0][0].toFixed(1)},${H - pad} Z`;
  const last = data[data.length - 1];

  return (
    <div>
      <p className="mb-2 text-sm text-slate-500">
        Latest: <span className="font-semibold text-slate-800">{money ? formatMoney(last.value) : last.value}</span>
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full" preserveAspectRatio="none" role="img" aria-label="Sales trend">
        <defs>
          <linearGradient id="babaArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PALETTE[0]} stopOpacity="0.25" />
            <stop offset="100%" stopColor={PALETTE[0]} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#babaArea)" />
        <path d={line} fill="none" stroke={PALETTE[0]} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={PALETTE[0]} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-slate-400">
        <span>{data[0].label}</span>
        <span>{last.label}</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Horizontal bars
export function HBarChart({ data, money = true }) {
  if (!data || data.length === 0) return <ChartEmpty />;
  const max = Math.max(1, ...data.map((d) => d.value || 0));
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate pr-2 font-medium text-slate-700">{d.label}</span>
            <span className="shrink-0 text-slate-500">{money ? formatMoney(d.value) : d.value}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${((d.value || 0) / max) * 100}%`, backgroundColor: PALETTE[i % PALETTE.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// --------------------------------------------------------------------- Donut
export function DonutChart({ data }) {
  const items = (data || []).filter((d) => (d.value || 0) > 0);
  if (items.length === 0) return <ChartEmpty />;
  const total = items.reduce((s, d) => s + d.value, 0);
  const R = 60;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
      <svg viewBox="0 0 160 160" className="h-40 w-40" role="img" aria-label="Distribution">
        <g transform="translate(80,80) rotate(-90)">
          <circle r={R} fill="none" stroke="#f1f5f9" strokeWidth="20" />
          {items.map((d, i) => {
            const frac = d.value / total;
            const dash = frac * C;
            const seg = (
              <circle
                key={i}
                r={R}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth="20"
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return seg;
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" className="fill-slate-900 text-[22px] font-bold">
          {total}
        </text>
        <text x="80" y="94" textAnchor="middle" className="fill-slate-400 text-[10px]">
          total
        </text>
      </svg>
      <div className="space-y-1.5">
        {items.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="font-semibold text-slate-800">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function ChartEmpty() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-slate-400">No data yet</div>
  );
}
