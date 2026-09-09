import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { mockVehicles } from '../../api/mockData';
import { formatCurrency } from '../../utils/formatters';
import {
  Check,
  X,
  ArrowRight,
  ChevronRight,
  Layers,
  Plus,
} from 'lucide-react';

export default function Compare() {
  const [searchParams] = useSearchParams();
  const ids = (searchParams.get('ids') || 'veh_1,veh_2,veh_3').split(',').filter(Boolean);

  const selectedVehicles = mockVehicles.filter((v) => ids.includes(v._id));

  // If no vehicles or only 1, pick top 3 by default
  const displayVehicles = selectedVehicles.length >= 2 ? selectedVehicles : mockVehicles.slice(0, 3);

  const featureList = [
    'Bluetooth Audio',
    'Touchscreen',
    'Fastag Enabled',
    'Reverse Parking Sensors',
    'Sunroof',
    'Cruise Control',
    'Apple CarPlay / Android Auto',
    'Ventilated Seats',
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <Link to="/" className="hover:text-slate-600">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/cars" className="hover:text-slate-600">Fleet</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800">Compare Cars</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Layers className="w-7 h-7 text-brand-600" />
            Vehicle Comparison
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Compare specs, pricing, and features side-by-side to choose the perfect car for your journey.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/4 bg-slate-50/50">
                  Vehicle
                </th>
                {displayVehicles.map((v) => (
                  <th key={v._id} className="p-6 w-1/4 align-top">
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 mb-3">
                      <img src={v.images[0]} alt={v.model} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                      {v.type}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1.5">
                      {v.make} {v.model}
                    </h3>
                    <p className="text-xs text-slate-400">{v.variant}</p>
                    <div className="mt-3">
                      <span className="text-xl font-black text-slate-900">
                        {formatCurrency(v.pricing?.daily)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium"> / day</span>
                    </div>
                    <Link
                      to={`/booking?vehicleId=${v._id}`}
                      className="mt-4 w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <span>Book Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {/* Security Deposit */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Security Deposit</td>
                {displayVehicles.map((v) => (
                  <td key={v._id} className="p-4 font-bold text-slate-800">
                    {formatCurrency(v.securityDeposit)}
                  </td>
                ))}
              </tr>

              {/* Seating */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Seating Capacity</td>
                {displayVehicles.map((v) => (
                  <td key={v._id} className="p-4 font-semibold text-slate-800">
                    {v.seats} Passengers
                  </td>
                ))}
              </tr>

              {/* Transmission */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Transmission</td>
                {displayVehicles.map((v) => (
                  <td key={v._id} className="p-4 font-semibold text-slate-800 capitalize">
                    {v.transmission?.toLowerCase()}
                  </td>
                ))}
              </tr>

              {/* Fuel */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Fuel Type</td>
                {displayVehicles.map((v) => (
                  <td key={v._id} className="p-4 font-semibold text-slate-800 capitalize">
                    {v.fuelType?.toLowerCase()}
                  </td>
                ))}
              </tr>

              {/* Baggage */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Baggage Capacity</td>
                {displayVehicles.map((v) => (
                  <td key={v._id} className="p-4 font-semibold text-slate-800">
                    {v.baggageCapacity || 2} Large Bags
                  </td>
                ))}
              </tr>

              {/* Free KM */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Included Daily KM</td>
                {displayVehicles.map((v) => (
                  <td key={v._id} className="p-4 font-semibold text-slate-800">
                    {v.pricing?.freeKmPerDay || 250} km / day
                  </td>
                ))}
              </tr>

              {/* Extra KM Rate */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Extra KM Rate</td>
                {displayVehicles.map((v) => (
                  <td key={v._id} className="p-4 font-semibold text-slate-800">
                    ₹{v.pricing?.extraKmCharge || 12} / km
                  </td>
                ))}
              </tr>

              {/* Features section */}
              <tr>
                <td colSpan={displayVehicles.length + 1} className="p-4 font-bold text-slate-900 bg-slate-100 uppercase tracking-wider text-[11px]">
                  Feature Checklist
                </td>
              </tr>

              {featureList.map((feat) => (
                <tr key={feat}>
                  <td className="p-4 font-semibold text-slate-600 bg-slate-50/50">{feat}</td>
                  {displayVehicles.map((v) => {
                    const has = v.features?.includes(feat);
                    return (
                      <td key={v._id} className="p-4">
                        {has ? (
                          <div className="flex items-center gap-1 text-emerald-600 font-bold">
                            <Check className="w-4 h-4" />
                            <span>Included</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-300">
                            <X className="w-4 h-4" />
                            <span>—</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

