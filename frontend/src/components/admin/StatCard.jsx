import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, color = 'brand' }) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-600 border-brand-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colorMap[color] || colorMap.brand}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {(trend !== undefined || trendLabel) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold">
          {trend > 0 ? (
            <span className="text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +{trend}%
            </span>
          ) : trend < 0 ? (
            <span className="text-rose-600 flex items-center gap-0.5">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {trend}%
            </span>
          ) : null}
          {trendLabel && <span className="text-slate-400 font-normal">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}

