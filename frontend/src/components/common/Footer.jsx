import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Phone, Mail, MapPin, ShieldCheck, Clock, Award } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 mb-12 border-b border-slate-800/80">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">100% Sanitized & Inspected</h4>
              <p className="text-xs text-slate-400 mt-0.5">Comprehensive 40-point vehicle check before every handover</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-accent-500/10 text-accent-400 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Instant Transparent Booking</h4>
              <p className="text-xs text-slate-400 mt-0.5">Zero hidden charges with fully refundable security deposits</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">24/7 Roadside Assistance</h4>
              <p className="text-xs text-slate-400 mt-0.5">Dedicated breakdown support across Punjab, Chandigarh & Himachal highways</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white">
                <Car className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Drive<span className="text-brand-400">Easy</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Premium self-drive car rentals in Chandigarh & Kharar. Well-maintained hatchbacks, sedans, SUVs, and luxury cars with doorstep delivery and fast digital check-in.
            </p>
            <div className="pt-2 text-xs text-slate-500">
              Operated by Akash Car Rental Pvt. Ltd.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Our Fleet</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/cars?type=HATCHBACK" className="hover:text-brand-400 transition-colors">
                  Compact Hatchbacks
                </Link>
              </li>
              <li>
                <Link to="/cars?type=SEDAN" className="hover:text-brand-400 transition-colors">
                  Comfort Sedans
                </Link>
              </li>
              <li>
                <Link to="/cars?type=SUV" className="hover:text-brand-400 transition-colors">
                  Spacious SUVs
                </Link>
              </li>
              <li>
                <Link to="/cars?type=LUXURY" className="hover:text-brand-400 transition-colors">
                  Executive & Luxury
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-brand-400 transition-colors">
                  Side-by-side Car Compare
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies & Support */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Policies & Help</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/policies#terms" className="hover:text-brand-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/policies#cancellation" className="hover:text-brand-400 transition-colors">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link to="/policies#insurance" className="hover:text-brand-400 transition-colors">
                  Insurance & Damage Cover
                </Link>
              </li>
              <li>
                <Link to="/documents" className="hover:text-brand-400 transition-colors">
                  Driving License Guidelines
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-400 transition-colors">
                  About Akash Car Rental
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Contact Hub</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-slate-400">
                <MapPin className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                <span>Sector 17C, Near Neelam Cinema, Chandigarh (UT) 160017</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Phone className="w-5 h-5 text-brand-400 shrink-0" />
                <a href="tel:+919820010000" className="hover:text-white transition-colors">
                  +91 98200 10000
                </a>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Mail className="w-5 h-5 text-brand-400 shrink-0" />
                <a href="mailto:support@driveeasy.example" className="hover:text-white transition-colors">
                  support@driveeasy.example
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-10 mt-10 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Akash Car Rental (DriveEasy). All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/policies#privacy" className="hover:text-slate-400">Privacy Policy</Link>
            <Link to="/policies#terms" className="hover:text-slate-400">Terms of Service</Link>
            <Link to="/contact" className="hover:text-slate-400">Support Desk</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

