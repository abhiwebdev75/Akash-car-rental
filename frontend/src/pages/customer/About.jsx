import React from 'react';
import { Car, ShieldCheck, Award, Users, HeartHandshake, MapPin } from 'lucide-react';

export default function About() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600">About DriveEasy</span>
          <h1 className="text-4xl font-black text-slate-900 mt-1 tracking-tight">
            Redefining Self-Drive Mobility in Chandigarh & Punjab
          </h1>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            Founded with a vision to eliminate the friction, hidden fees, and uncertainty of car rentals, Akash Car Rental operates a modern, meticulously maintained fleet across Chandigarh and Kharar (Chandigarh University Hub).
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center shadow-sm">
            <span className="text-3xl font-black text-brand-600 block">12+</span>
            <span className="text-xs font-bold text-slate-500 mt-1 block">Vehicles in Fleet</span>
          </div>
          <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center shadow-sm">
            <span className="text-3xl font-black text-emerald-600 block">2</span>
            <span className="text-xs font-bold text-slate-500 mt-1 block">Pickup Hubs</span>
          </div>
          <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center shadow-sm">
            <span className="text-3xl font-black text-amber-600 block">4.9/5</span>
            <span className="text-xs font-bold text-slate-500 mt-1 block">Average Rating</span>
          </div>
          <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center shadow-sm">
            <span className="text-3xl font-black text-indigo-600 block">100%</span>
            <span className="text-xs font-bold text-slate-500 mt-1 block">Inspected & Safe</span>
          </div>
        </div>

        {/* Mission & Standards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <ShieldCheck className="w-8 h-8 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-900">40-Point Maintenance Protocol</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every vehicle undergoes automated diagnostic scanning, brake inspections, tyre tread depth verification, and comprehensive interior steam sanitization between each handover.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <HeartHandshake className="w-8 h-8 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Zero Security Deposit Friction</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We never hold customer deposits hostage. As soon as the digital check-out inspection is completed by staff, your deposit is released back into your UPI or bank account automatically.
            </p>
          </div>
        </div>

        {/* CU Students */}
        <div className="bg-gradient-to-r from-brand-50 to-sky-50 p-8 rounded-3xl border border-brand-200 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-brand-600" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">Proud Partners of Chandigarh University Students</h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                Our Kharar hub is located on NH-05 with doorstep vehicle handover at the CU Main Gate.
                CU students get an exclusive <span className="font-bold text-brand-600">10% discount</span> using promo code <span className="font-mono font-bold text-brand-700">CU10</span> on every rental.
                Just keep your valid CU Student ID handy!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

