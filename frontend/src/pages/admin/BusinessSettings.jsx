import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Settings, Save, ShieldCheck, Building2, Percent, Clock } from 'lucide-react';

export default function BusinessSettings() {
  const toast = useToast();

  const [settings, setSettings] = useState({
    businessName: 'DriveEasy Car Rentals',
    phone: '+91 98200 10000',
    email: 'hello@driveeasy.example',
    whatsapp: '+91 98200 10000',
    address: '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
    currency: 'INR',
    taxRate: 18,
    turnoverBufferMinutes: 30,
    minRentalHours: 4,
    cancellationWindowHours: 24,
  });

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Business settings & pricing rules updated!');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" />
          Business Configuration & Policy Rules
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Owner Only: Central business metadata, turnover cleaning buffer, and tax calculations.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Profile */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" /> Company Contact Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Business Name</label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
                required
              />
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Helpline Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Official Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
                required
              />
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">WhatsApp Hotline</label>
              <input
                type="text"
                value={settings.whatsapp}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold uppercase text-slate-700 block mb-1">Registered Address</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
              required
            />
          </div>
        </div>

        {/* Pricing & Availability Engine Parameters */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" /> Operational & Availability Engine Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">
                GST Tax Rate (%)
              </label>
              <input
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-bold"
                required
              />
            </div>

            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">
                Turnover Buffer (Mins)
              </label>
              <input
                type="number"
                value={settings.turnoverBufferMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, turnoverBufferMinutes: Number(e.target.value) })
                }
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-bold"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Cleaning window between consecutive bookings
              </span>
            </div>

            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">
                Free Cancel Window (Hours)
              </label>
              <input
                type="number"
                value={settings.cancellationWindowHours}
                onChange={(e) =>
                  setSettings({ ...settings, cancellationWindowHours: Number(e.target.value) })
                }
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-bold"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                100% refund window prior to pickup
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-brand-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}

