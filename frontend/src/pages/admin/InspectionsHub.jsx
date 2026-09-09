import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { mockVehicles, mockBookings } from '../../api/mockData';
import {
  CheckCircle2,
  Camera,
  Gauge,
  Fuel,
  AlertTriangle,
  FileCheck,
  Plus,
  Car,
} from 'lucide-react';

export default function InspectionsHub() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('PICKUP'); // PICKUP or RETURN

  // Pickup inspection form state
  const [pickupVehicle, setPickupVehicle] = useState(mockVehicles[0]._id);
  const [pickupOdometer, setPickupOdometer] = useState(15400);
  const [pickupFuel, setPickupFuel] = useState(100);
  const [cleanliness, setCleanliness] = useState('EXCELLENT');
  const [pickupNotes, setPickupNotes] = useState('Vehicle washed and sanitized. Spare tyre in boot.');

  // Return inspection form state
  const [returnVehicle, setReturnVehicle] = useState(mockVehicles[2]._id);
  const [returnOdometer, setReturnOdometer] = useState(16200);
  const [returnFuel, setReturnFuel] = useState(80);
  const [excessKmCharge, setExcessKmCharge] = useState(0);
  const [fuelDeficitCharge, setFuelDeficitCharge] = useState(0);
  const [returnCondition, setReturnCondition] = useState('GOOD');

  const handleCreatePickupInspection = (e) => {
    e.preventDefault();
    toast.success('Pickup Inspection recorded with digital signoff!');
  };

  const handleCreateReturnInspection = (e) => {
    e.preventDefault();
    toast.success('Return Inspection completed! Excess charges recorded and deposit release cleared.');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Vehicle Inspections & Check-in / Return
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Digital 40-point condition reports, odometer logging, and automated charge calculations.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('PICKUP')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'PICKUP'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Pickup / Handover Checklist
        </button>
        <button
          onClick={() => setActiveTab('RETURN')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'RETURN'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Return / Check-in & Charge Engine
        </button>
      </div>

      {/* Forms Area */}
      {activeTab === 'PICKUP' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 max-w-3xl">
          <form onSubmit={handleCreatePickupInspection} className="space-y-5 text-xs">
            <h3 className="text-base font-extrabold text-slate-900">
              New Pickup Handover Inspection
            </h3>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Select Vehicle</label>
              <select
                value={pickupVehicle}
                onChange={(e) => setPickupVehicle(e.target.value)}
                className="w-full h-11 bg-slate-50 border rounded-xl px-3 font-semibold"
              >
                {mockVehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.make} {v.model} ({v.registrationNumber}) — {v.location?.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-brand-600" /> Current Odometer (KM)
                </label>
                <input
                  type="number"
                  value={pickupOdometer}
                  onChange={(e) => setPickupOdometer(Number(e.target.value))}
                  className="w-full h-11 bg-slate-50 border rounded-xl px-3 font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1 flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-brand-600" /> Fuel Level (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pickupFuel}
                  onChange={(e) => setPickupFuel(Number(e.target.value))}
                  className="w-full h-11 bg-slate-50 border rounded-xl px-3 font-mono font-bold text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1">Cleanliness</label>
                <select
                  value={cleanliness}
                  onChange={(e) => setCleanliness(e.target.value)}
                  className="w-full h-11 bg-slate-50 border rounded-xl px-3 font-semibold"
                >
                  <option value="EXCELLENT">EXCELLENT (Showroom condition)</option>
                  <option value="GOOD">GOOD (Clean)</option>
                  <option value="FAIR">FAIR</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1">Photo Verification</label>
                <div className="h-11 border border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 bg-slate-50 text-slate-500 cursor-pointer">
                  <Camera className="w-4 h-4 text-brand-600" />
                  <span className="font-semibold">Attach 6 Handover Photos</span>
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Inspector Notes</label>
              <textarea
                rows={2}
                value={pickupNotes}
                onChange={(e) => setPickupNotes(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl p-3 font-medium text-slate-800"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit & Lock Pickup Condition</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 max-w-3xl">
          <form onSubmit={handleCreateReturnInspection} className="space-y-5 text-xs">
            <h3 className="text-base font-extrabold text-slate-900">
              Vehicle Return Check-In & Final Charge Settlement
            </h3>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Select Returning Vehicle</label>
              <select
                value={returnVehicle}
                onChange={(e) => setReturnVehicle(e.target.value)}
                className="w-full h-11 bg-slate-50 border rounded-xl px-3 font-semibold"
              >
                {mockVehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.make} {v.model} ({v.registrationNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1">Return Odometer (KM)</label>
                <input
                  type="number"
                  value={returnOdometer}
                  onChange={(e) => setReturnOdometer(Number(e.target.value))}
                  className="w-full h-11 bg-slate-50 border rounded-xl px-3 font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1">Return Fuel (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={returnFuel}
                  onChange={(e) => setReturnFuel(Number(e.target.value))}
                  className="w-full h-11 bg-slate-50 border rounded-xl px-3 font-mono font-bold text-sm"
                  required
                />
              </div>
            </div>

            {/* Auto-computed charges card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="font-bold text-slate-900 block">Automated Adjustments</span>
              <div className="flex justify-between text-slate-600">
                <span>Extra KM Traveled (0 KM over allowance)</span>
                <span className="font-bold text-slate-800">₹0</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fuel Difference (Returned at 80% vs 95% at pickup)</span>
                <span className="font-bold text-slate-800">₹450</span>
              </div>
              <div className="pt-2 border-t flex justify-between font-bold text-slate-900">
                <span>Net Security Deposit to Refund</span>
                <span className="text-emerald-600 text-sm">₹6,550 of ₹7,000</span>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Return & Release Deposit</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

