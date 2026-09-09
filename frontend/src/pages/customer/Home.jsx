import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HeroSearchWidget from '../../components/customer/HeroSearchWidget';
import VehicleCard from '../../components/customer/VehicleCard';
import { mockVehicles, mockCustomerReviews, mockStudentGetaways } from '../../api/mockData';
import {
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  ArrowRight,
  Star,
  CheckCircle2,
  Tag,
  PhoneCall,
  Car,
  GraduationCap,
  MapPin,
  Navigation,
} from 'lucide-react';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = [
    { label: 'All Fleet', value: 'ALL' },
    { label: 'Hatchbacks', value: 'HATCHBACK' },
    { label: 'Sedans', value: 'SEDAN' },
    { label: 'SUVs & MUVs', value: 'SUV' },
    { label: 'Luxury', value: 'LUXURY' },
  ];

  const filteredVehicles = mockVehicles.filter((v) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'SUV') return v.type === 'SUV' || v.type === 'MUV';
    return v.type === selectedCategory;
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── HERO SECTION ──────────────────────────────────────── */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
        {/* Background glow and decorative mesh */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-300 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-accent-400" />
              <span>Chandigarh & Kharar's Most Trusted Self-Drive Car Rental</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Premium Cars for <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-sky-300 to-accent-300">
                Unforgettable Journeys
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Book sanitized, fully-insured self-drive hatchbacks, sedans, SUVs, and luxury vehicles. Zero paperwork, transparent rates, and instant digital check-in across Chandigarh & Kharar.
            </p>
          </div>

          {/* Search Booking Box */}
          <div className="mt-8">
            <HeroSearchWidget />
          </div>
        </div>
      </section>

      {/* ── CU STUDENT PROMO BANNER ───────────────────────────── */}
      <section className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 py-3.5 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-center">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-slate-950" />
            <span>CU STUDENTS: Use code</span>
            <span className="px-2 py-0.5 bg-slate-950 text-amber-300 rounded font-mono tracking-wider">
              CU10
            </span>
            <span>for 10% off (up to ₹1,500) on all rentals!</span>
          </div>
          <span className="hidden sm:inline opacity-40">•</span>
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" />
            <span>Doorstep handover at CU Main Gate, Kharar</span>
          </div>
        </div>
      </section>

      {/* ── FEATURED FLEET ────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
                Our Fleet Catalog
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
                Explore Vehicles Available Today
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Well-maintained, high-efficiency models ready for city drives and Himalayan road trips.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === cat.value
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVehicles.slice(0, 8).map((vehicle) => (
              <VehicleCard key={vehicle._id} vehicle={vehicle} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/cars"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white border border-slate-300 text-slate-800 text-sm font-bold shadow-sm hover:border-brand-500 hover:text-brand-600 transition-all"
            >
              <span>View Full Fleet ({mockVehicles.length} Vehicles Available)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CU STUDENT ROAD TRIPS ─────────────────────────────── */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
              Weekend Getaway Ideas
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              Popular Road Trips from Chandigarh University
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Grab your friends, pick up a car from our Kharar CU Hub, and hit the Himachal highways.
              Use code <span className="font-mono font-bold text-brand-600">CU10</span> for 10% off!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mockStudentGetaways.map((trip) => (
              <div
                key={trip.id}
                className="rounded-3xl overflow-hidden bg-slate-50 border border-slate-200/80 hover:shadow-xl hover:border-brand-200 transition-all group"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={trip.image}
                    alt={trip.destination}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-lg font-bold text-slate-900">{trip.destination}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-500" />
                      {trip.distance}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brand-500" />
                      {trip.driveTime}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{trip.description}</p>
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Recommended:</span>
                    <span className="ml-1.5 text-xs font-bold text-brand-600">{trip.recommendedCar}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ─────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
              The Akash Car Rental Edge
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              Why Discerning Drivers Choose Us
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              We treat your journey with the respect, safety, and reliability you deserve.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 hover:border-brand-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Zero Security Deposit Drama</h3>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Security deposits are held in escrow and automatically refunded to your original UPI or card account immediately after digital vehicle check-in.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 hover:border-brand-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">5-Minute Digital Handover</h3>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Skip lengthy counter lines. Complete online KYC, sign your digital rental agreement from your smartphone, unlock, and drive off seamlessly.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 hover:border-brand-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-6">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">24/7 Roadside Assistance</h3>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Whether you encounter a flat tyre on the Chandigarh-Shimla Highway or require emergency jump-start, our roadside recovery team is just one SOS click away.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-400">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              How Renting with DriveEasy Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="relative p-8 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex flex-col">
              <span className="text-5xl font-black text-slate-700 mb-4">01</span>
              <h3 className="text-lg font-bold text-white mb-2">Select Dates & Vehicle</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Choose your pickup hub (Chandigarh Sector 17 or Kharar CU Gate), travel dates, and pick from our diverse lineup of hatchback, sedan, or SUV models.
              </p>
            </div>

            <div className="relative p-8 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex flex-col">
              <span className="text-5xl font-black text-slate-700 mb-4">02</span>
              <h3 className="text-lg font-bold text-white mb-2">Verify Driving License</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Upload a clear photo of your Indian Driving License and Govt ID (or CU Student ID) for instant verification by our automated document engine.
              </p>
            </div>

            <div className="relative p-8 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex flex-col">
              <span className="text-5xl font-black text-slate-700 mb-4">03</span>
              <h3 className="text-lg font-bold text-white mb-2">Drive with Peace of Mind</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Pick up keys at our hub or get doorstep delivery at CU Main Gate. Enjoy scenic Himachal highways with 24/7 support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CUSTOMER REVIEWS ──────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
              Verified Feedback
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              Loved by Over 10,000+ Renters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockCustomerReviews.map((rev) => (
              <div
                key={rev._id}
                className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mb-2">{rev.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">"{rev.comment}"</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{rev.author}</span>
                    <span className="text-slate-400">{rev.car}</span>
                  </div>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-tr from-brand-700 to-brand-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black">
              Ready to Hit the Open Road?
            </h2>
            <p className="text-brand-100 text-sm mt-1 max-w-xl">
              Choose your ideal car today and experience transparent, hassle-free car rental in Chandigarh & Kharar.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/cars"
              className="px-6 py-3.5 rounded-xl bg-white text-brand-700 font-bold text-sm shadow-lg hover:bg-slate-100 transition-all"
            >
              Browse Full Fleet
            </Link>
            <a
              href="tel:+919876510001"
              className="px-6 py-3.5 rounded-xl bg-brand-800/80 border border-white/20 text-white font-bold text-sm hover:bg-brand-900 transition-all flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Us Anytime</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

