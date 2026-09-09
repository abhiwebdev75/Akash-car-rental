import React from 'react';
import { Shield, Clock, AlertTriangle, FileText } from 'lucide-react';

export default function Policies() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600">Legal & Transparency</span>
          <h1 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Terms, Cancellation & Rental Policies
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Clear, transparent rules with zero hidden traps. Please read before booking.
          </p>
        </div>

        {/* Section: Terms */}
        <div id="terms" className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">1. Eligibility & Driver Requirements</h2>
          </div>
          <div className="text-xs text-slate-600 leading-relaxed space-y-2">
            <p>• The primary driver must be at least 21 years of age.</p>
            <p>• Must hold an original, non-expired Indian Driving License held for a minimum duration of 1 year.</p>
            <p>• Digital KYC document submission (Driving License + Govt ID) must be approved before vehicle keys can be released.</p>
            <p>• Only drivers explicitly listed as Authorised Additional Drivers in the rental agreement are insured to operate the vehicle.</p>
          </div>
        </div>

        {/* Section: Cancellation */}
        <div id="cancellation" className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">2. Cancellation & Refund Policy</h2>
          </div>
          <div className="text-xs text-slate-600 leading-relaxed space-y-2">
            <p>• <strong>More than 24 hours prior to pickup:</strong> 100% full refund of the rental amount and security deposit.</p>
            <p>• <strong>Within 24 hours of scheduled pickup:</strong> 50% refund of rental amount, 100% refund of security deposit.</p>
            <p>• <strong>No-Show / After pickup time:</strong> No rental refund; security deposit is refunded 100%.</p>
            <p>• Refunds are processed back to the original UPI/Card account within 2 to 4 business hours.</p>
          </div>
        </div>

        {/* Section: Fuel & Kilometers */}
        <div id="fuel" className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">3. Fuel & Fair Usage Policy</h2>
          </div>
          <div className="text-xs text-slate-600 leading-relaxed space-y-2">
            <p>• <strong>Fuel Level:</strong> Same-to-same policy. If you receive the car at 80% fuel, return at 80% or higher. Any deficit is calculated at standard pump rates with zero convenience markup.</p>
            <p>• <strong>Speed Limits:</strong> Safe driving speed limit is 100 km/h on national expressways as per Indian road safety regulations.</p>
            <p>• <strong>Tolls & Fastag:</strong> Every car has an activated Fastag RFID. Any highway toll deductions during the rental duration will be itemized and settled from the security deposit at check-out.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

