import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { LifeBuoy, Phone, CheckCircle2, Clock, MapPin, AlertCircle } from 'lucide-react';

export default function EmergencyHub() {
  const toast = useToast();
  const [emergencies, setEmergencies] = useState([
    {
      id: 'emg_1',
      bookingNumber: 'CR-2026-000101',
      customerName: 'Neha Sharma',
      phone: '+91 90000 10001',
      vehicle: 'Hyundai Creta SX (KA01EF7890)',
      type: 'FLAT_TYRE',
      description: 'Right rear tyre puncture near Pinjore toll gate on Chandigarh-Shimla Highway.',
      status: 'OPEN',
      createdAt: '15 mins ago',
    },
    {
      id: 'emg_2',
      bookingNumber: 'CR-2026-000095',
      customerName: 'Karthik Iyer',
      phone: '+91 90000 10004',
      vehicle: 'Toyota Innova Crysta (KA01EF5678)',
      type: 'BATTERY',
      description: 'Key fob battery issue, vehicle immobilizer engaged at hotel parking.',
      status: 'RESOLVED',
      createdAt: '2 hours ago',
    },
  ]);

  const handleUpdateStatus = (id, newStatus) => {
    setEmergencies((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
    );
    toast.success(`Emergency ticket marked as ${newStatus}`);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <LifeBuoy className="w-6 h-6 text-rose-600" />
          24/7 Roadside SOS & Assistance Dispatch
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live customer emergency requests from active road trips. Coordinate highway recovery immediately.
        </p>
      </div>

      <div className="space-y-4">
        {emergencies.map((emg) => (
          <div
            key={emg.id}
            className={`p-6 rounded-3xl border shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
              emg.status === 'OPEN'
                ? 'bg-rose-50/40 border-rose-200'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    emg.status === 'OPEN'
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {emg.status}
                </span>
                <span className="font-mono font-bold text-slate-500">{emg.bookingNumber}</span>
                <span className="text-slate-400">• {emg.createdAt}</span>
              </div>

              <h3 className="font-extrabold text-slate-900 text-base">
                {emg.type.replace('_', ' ')} — {emg.vehicle}
              </h3>

              <p className="text-slate-700 font-medium">{emg.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-slate-500 pt-1">
                <span>Driver: <strong>{emg.customerName}</strong></span>
                <a
                  href={`tel:${emg.phone}`}
                  className="flex items-center gap-1 text-brand-600 font-bold hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{emg.phone}</span>
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {emg.status === 'OPEN' && (
                <button
                  onClick={() => handleUpdateStatus(emg.id, 'ACKNOWLEDGED')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm"
                >
                  Acknowledge & Dispatch
                </button>
              )}
              {emg.status !== 'RESOLVED' && (
                <button
                  onClick={() => handleUpdateStatus(emg.id, 'RESOLVED')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

