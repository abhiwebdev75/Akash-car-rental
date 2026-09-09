import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Fuel, Gauge, Briefcase, Star, ShieldCheck, ArrowRight, Plus, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function VehicleCard({ vehicle, searchParams = {}, onCompare, isCompared }) {
  const query = new URLSearchParams(searchParams).toString();
  const bookUrl = `/booking?vehicleId=${vehicle._id}${query ? `&${query}` : ''}`;
  const detailUrl = `/cars/${vehicle._id}${query ? `&${query}` : ''}`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-200 flex flex-col overflow-hidden group">
      {/* Image Header with Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'}
          alt={`${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-900/80 text-white backdrop-blur-md uppercase tracking-wider">
            {vehicle.type}
          </span>
          {vehicle.status === 'AVAILABLE' ? (
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-600/90 text-white backdrop-blur-md">
              Available
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-600/90 text-white backdrop-blur-md">
              {vehicle.status}
            </span>
          )}
        </div>

        {/* Compare Toggle */}
        {onCompare && (
          <button
            onClick={() => onCompare(vehicle)}
            className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-md transition-all flex items-center gap-1 ${
              isCompared
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-white/80 hover:bg-white text-slate-700'
            }`}
          >
            {isCompared ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Compare</span>
          </button>
        )}

        {/* Rating chip */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold shadow-sm">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{vehicle.averageRating || '4.9'}</span>
          <span className="text-slate-400 font-normal">({vehicle.reviewCount || '18'})</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title & Variant */}
          <div className="mb-3">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {vehicle.variant} • {vehicle.year} Model
            </p>
          </div>

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-4 gap-2 py-3 border-y border-slate-100 text-slate-600 text-xs font-medium">
            <div className="flex flex-col items-center text-center">
              <Users className="w-4 h-4 text-slate-400 mb-1" />
              <span>{vehicle.seats} Seats</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Gauge className="w-4 h-4 text-slate-400 mb-1" />
              <span>{vehicle.transmission === 'AUTOMATIC' ? 'Auto' : 'Manual'}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Fuel className="w-4 h-4 text-slate-400 mb-1" />
              <span className="capitalize">{vehicle.fuelType?.toLowerCase()}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Briefcase className="w-4 h-4 text-slate-400 mb-1" />
              <span>{vehicle.baggageCapacity || 2} Bags</span>
            </div>
          </div>
        </div>

        {/* Bottom Pricing & CTA */}
        <div className="mt-4 pt-2">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-2xl font-extrabold text-slate-900">
                {formatCurrency(vehicle.pricing?.daily)}
              </span>
              <span className="text-xs text-slate-500 font-medium"> / day</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Security Deposit</span>
              <span className="text-xs font-bold text-slate-700">
                {formatCurrency(vehicle.securityDeposit)} (Refundable)
              </span>
            </div>
          </div>

          {/* Button Group */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={detailUrl}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
            >
              Details
            </Link>
            <Link
              to={bookUrl}
              className="px-3 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-center text-xs font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
            >
              <span>Book Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

