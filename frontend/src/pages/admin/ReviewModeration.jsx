import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { mockCustomerReviews } from '../../api/mockData';
import { Star, CheckCircle2, Eye, EyeOff, Shield } from 'lucide-react';

export default function ReviewModeration() {
  const toast = useToast();
  const [reviews, setReviews] = useState(
    mockCustomerReviews.map((r) => ({ ...r, visible: true }))
  );

  const handleToggleVisibility = (id) => {
    setReviews((prev) =>
      prev.map((r) => (r._id === id ? { ...r, visible: !r.visible } : r))
    );
    toast.success('Review visibility updated!');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Customer Reviews & Rating Moderation
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Moderate verified customer feedback displayed on the public storefront and vehicle detail pages.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((r) => (
          <div
            key={r._id}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-slate-400">{r.date}</span>
              </div>

              <h4 className="font-extrabold text-slate-900 text-sm mt-3">{r.title}</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">"{r.comment}"</p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{r.author}</span>
                  <span className="text-slate-400 text-[11px]">{r.car}</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    r.visible
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {r.visible ? 'VISIBLE' : 'HIDDEN'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => handleToggleVisibility(r._id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  r.visible
                    ? 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                {r.visible ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide from Website</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show on Website</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

