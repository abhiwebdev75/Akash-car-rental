import React, { useState } from 'react';
import { mockVehicles, mockBookings } from '../../api/mockData';
import { formatDate } from '../../utils/formatters';
import { Calendar, ChevronLeft, ChevronRight, Car, User } from 'lucide-react';

export default function CalendarView() {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Generate 7 days for the current week view
  const days = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + currentWeekOffset * 7);

  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header with Week Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Booking & Availability Timeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visual fleet schedule showing reservations, handovers, and open booking slots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeekOffset((p) => p - 1)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 px-3 py-1.5 bg-white border border-slate-200 rounded-xl">
            {formatDate(days[0])} — {formatDate(days[6])}
          </span>
          <button
            onClick={() => setCurrentWeekOffset((p) => p + 1)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Matrix Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px] text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-left font-bold text-slate-400 uppercase tracking-wider w-64 border-r border-slate-200">
                Vehicle Fleet
              </th>
              {days.map((d, i) => {
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                  <th
                    key={i}
                    className={`p-3 text-center border-r border-slate-200 last:border-r-0 ${
                      isToday ? 'bg-brand-50/80 text-brand-700' : 'text-slate-600'
                    }`}
                  >
                    <span className="block text-[11px] font-bold uppercase">
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="block text-sm font-extrabold">{d.getDate()}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockVehicles.map((vehicle, vIndex) => {
              // Check if car has sample booking
              const hasBooking = vIndex === 0 || vIndex === 2 || vIndex === 4;
              return (
                <tr key={vehicle._id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="p-4 border-r border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                      <img
                        src={vehicle.images?.[0]}
                        alt={vehicle.model}
                        className="w-12 h-8 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-[140px]">
                          {vehicle.make} {vehicle.model}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {vehicle.registrationNumber}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Day Slots */}
                  {days.map((d, dIndex) => {
                    // Show a sample booking block for visualization
                    const isBooked = hasBooking && (dIndex >= 1 && dIndex <= 3);
                    return (
                      <td
                        key={dIndex}
                        className="p-2 border-r border-slate-100 last:border-r-0 text-center relative h-16 align-middle"
                      >
                        {isBooked ? (
                          <div className="w-full h-10 rounded-xl bg-brand-600 text-white p-1.5 flex flex-col justify-center shadow-sm">
                            <span className="text-[10px] font-bold truncate">CR-2026-000101</span>
                            <span className="text-[9px] text-brand-100 truncate">Confirmed</span>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-200 text-xs hover:bg-slate-50/80 rounded cursor-pointer">
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

