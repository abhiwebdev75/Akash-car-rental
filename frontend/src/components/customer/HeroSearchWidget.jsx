import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { mockLocations } from '../../api/mockData';
import { calculateDays } from '../../utils/formatters';

export default function HeroSearchWidget({ initialValues = {}, onSearch }) {
  const navigate = useNavigate();

  // Tomorrow 10:00 as default pickup
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultPickupDate = tomorrow.toISOString().split('T')[0];

  // 4 days later 10:00 as default return
  const fourDaysLater = new Date();
  fourDaysLater.setDate(fourDaysLater.getDate() + 4);
  const defaultReturnDate = fourDaysLater.toISOString().split('T')[0];

  const [locationId, setLocationId] = useState(initialValues.locationId || 'loc_blr_1');
  const [pickupDate, setPickupDate] = useState(initialValues.pickupDate || defaultPickupDate);
  const [pickupTime, setPickupTime] = useState(initialValues.pickupTime || '10:00');
  const [returnDate, setReturnDate] = useState(initialValues.returnDate || defaultReturnDate);
  const [returnTime, setReturnTime] = useState(initialValues.returnTime || '10:00');

  const days = calculateDays(pickupDate, returnDate);

  const handleSubmit = (e) => {
    e.preventDefault();
    const searchParams = new URLSearchParams({
      locationId,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
    });

    if (onSearch) {
      onSearch({ locationId, pickupDate, pickupTime, returnDate, returnTime });
    } else {
      navigate(`/cars?${searchParams.toString()}`);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-6 lg:p-7 shadow-2xl shadow-slate-900/10 border border-slate-100 max-w-5xl mx-auto transition-all">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Location Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              Pickup & Return Hub
            </label>
            <div className="relative">
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full h-13 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all cursor-pointer"
              >
                {mockLocations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pickup Date & Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              Pickup Date & Time
            </label>
            <div className="grid grid-cols-5 gap-2">
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="col-span-3 h-13 bg-slate-50 border border-slate-200 rounded-2xl px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                required
              />
              <select
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="col-span-2 h-13 bg-slate-50 border border-slate-200 rounded-2xl px-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent cursor-pointer"
              >
                {['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Return Date & Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-600" />
              Return Date & Time
            </label>
            <div className="grid grid-cols-5 gap-2">
              <input
                type="date"
                min={pickupDate || new Date().toISOString().split('T')[0]}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="col-span-3 h-13 bg-slate-50 border border-slate-200 rounded-2xl px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                required
              />
              <select
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="col-span-2 h-13 bg-slate-50 border border-slate-200 rounded-2xl px-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent cursor-pointer"
              >
                {['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Search Button */}
          <div>
            <button
              type="submit"
              className="w-full h-13 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 hover:shadow-brand-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <span>Find Cars</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Duration badge and perks */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
              Rental Duration: {days} {days === 1 ? 'Day' : 'Days'}
            </span>
            <span>• Free cancellation up to 24h prior</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Best Price Guaranteed
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}

