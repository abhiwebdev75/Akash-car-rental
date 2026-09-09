import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { vehiclesApi } from '../../api/vehicles.api';
import { mockVehicles, mockCustomerReviews } from '../../api/mockData';
import { formatCurrency, calculateDays } from '../../utils/formatters';
import {
  Users,
  Fuel,
  Gauge,
  Briefcase,
  Star,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [vehicle, setVehicle] = useState(null);
  const [activeImage, setActiveImage] = useState(0);

  // Booking widget dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const fourDays = new Date();
  fourDays.setDate(fourDays.getDate() + 4);

  const [pickupDate, setPickupDate] = useState(
    searchParams.get('pickupDate') || tomorrow.toISOString().split('T')[0]
  );
  const [returnDate, setReturnDate] = useState(
    searchParams.get('returnDate') || fourDays.toISOString().split('T')[0]
  );
  const [pickupTime, setPickupTime] = useState(searchParams.get('pickupTime') || '10:00');
  const [returnTime, setReturnTime] = useState(searchParams.get('returnTime') || '10:00');

  useEffect(() => {
    vehiclesApi.getById(id).then((data) => {
      setVehicle(data || mockVehicles[0]);
    });
  }, [id]);

  if (!vehicle) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const days = calculateDays(pickupDate, returnDate);
  const estimatedRental = (vehicle.pricing?.daily || 2000) * days;
  const estimatedTax = Math.round(estimatedRental * 0.18);
  const estimatedTotal = estimatedRental + estimatedTax;

  const handleProceedToBook = () => {
    const params = new URLSearchParams({
      vehicleId: vehicle._id,
      locationId: vehicle.locationId || 'loc_blr_1',
      pickupDate,
      returnDate,
      pickupTime,
      returnTime,
    });
    navigate(`/booking?${params.toString()}`);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <Link to="/" className="hover:text-slate-600">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/cars" className="hover:text-slate-600">Fleet</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800">{vehicle.make} {vehicle.model}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Vehicle Details (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={vehicle.images?.[activeImage] || vehicle.images?.[0]}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover object-center transition-all duration-300"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white backdrop-blur-md">
                    {vehicle.type}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm">
                    {vehicle.status}
                  </span>
                </div>
              </div>

              {/* Thumbnails */}
              {vehicle.images?.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                  {vehicle.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        activeImage === idx
                          ? 'border-brand-600 ring-2 ring-brand-500/20'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Header info */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    {vehicle.make} {vehicle.model}
                  </h1>
                  <p className="text-sm font-semibold text-slate-500 mt-1">
                    {vehicle.variant} • {vehicle.year} Model • {vehicle.color || 'Premium Finish'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-sm font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{vehicle.averageRating || '4.9'}</span>
                  <span className="text-slate-400 font-normal">
                    ({vehicle.reviewCount || '24'} reviews)
                  </span>
                </div>
              </div>

              {/* Key Specs Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <Users className="w-5 h-5 text-brand-600 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Seats</span>
                    <span className="text-sm font-extrabold text-slate-800">{vehicle.seats} Passengers</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-brand-600 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Gearbox</span>
                    <span className="text-sm font-extrabold text-slate-800">{vehicle.transmission}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <Fuel className="w-5 h-5 text-brand-600 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Fuel Type</span>
                    <span className="text-sm font-extrabold text-slate-800 capitalize">{vehicle.fuelType?.toLowerCase()}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-brand-600 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">Luggage</span>
                    <span className="text-sm font-extrabold text-slate-800">{vehicle.baggageCapacity || 3} Suitcases</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Checklist */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Included Vehicle Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(vehicle.features || [
                  'Fastag Enabled',
                  'Reverse Camera',
                  'Apple CarPlay & Android Auto',
                  'ABS with EBD',
                  'Bluetooth Audio',
                  'Dual Front Airbags',
                ]).map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rental Policy & Location */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Rental Policies & Guidelines</h3>
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <span><strong>Driver Age:</strong> Minimum 21 years old with a valid Original Driver's License held for at least 1 year.</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <span><strong>Kilometer Policy:</strong> {vehicle.pricing?.freeKmPerDay || 250} km free per day. Extra km charged at ₹{vehicle.pricing?.extraKmCharge || 12}/km.</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <span><strong>Fuel Policy:</strong> Same-to-same. Pick up with a full/high tank, return with the same level or opt for Fuel Prepay.</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <span><strong>Free Cancellation:</strong> 100% refund on cancellations made at least 24 hours before scheduled pickup time.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Sticky Booking Widget Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xl shadow-slate-900/5 sticky top-28 space-y-6">
              {/* Daily rate header */}
              <div className="flex items-baseline justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-3xl font-black text-slate-900">
                    {formatCurrency(vehicle.pricing?.daily)}
                  </span>
                  <span className="text-xs text-slate-500 font-bold"> / day</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-bold uppercase">Weekly Rate</span>
                  <span className="text-xs font-bold text-emerald-600">
                    {formatCurrency(vehicle.pricing?.weekly)} (Save 15%)
                  </span>
                </div>
              </div>

              {/* Date pickers */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    Pickup Date & Time
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="col-span-3 h-11 bg-slate-50 border border-slate-200 rounded-xl px-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500"
                    />
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="col-span-2 h-11 bg-slate-50 border border-slate-200 rounded-xl px-2 text-xs font-bold text-slate-800"
                    >
                      {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-600" />
                    Return Date & Time
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    <input
                      type="date"
                      min={pickupDate}
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="col-span-3 h-11 bg-slate-50 border border-slate-200 rounded-xl px-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500"
                    />
                    <select
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="col-span-2 h-11 bg-slate-50 border border-slate-200 rounded-xl px-2 text-xs font-bold text-slate-800"
                    >
                      {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Price Breakdown Estimate */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Rental ({days} {days === 1 ? 'day' : 'days'})</span>
                  <span className="font-bold text-slate-800">{formatCurrency(estimatedRental)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18%)</span>
                  <span className="font-bold text-slate-800">{formatCurrency(estimatedTax)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200/80 flex justify-between font-extrabold text-sm text-slate-900">
                  <span>Estimated Total</span>
                  <span className="text-brand-600">{formatCurrency(estimatedTotal)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex justify-between text-[11px] text-slate-500">
                  <span>Refundable Security Deposit</span>
                  <span className="font-bold text-slate-700">
                    {formatCurrency(vehicle.securityDeposit)}
                  </span>
                </div>
              </div>

              {/* Book CTA */}
              <button
                onClick={handleProceedToBook}
                className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 hover:shadow-brand-500/40 transition-all"
              >
                <span>Proceed to Book</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero Cancellation Fees up to 24h prior</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

