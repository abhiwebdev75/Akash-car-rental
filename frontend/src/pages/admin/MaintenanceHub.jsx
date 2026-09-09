import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { mockVehicles, mockMaintenanceAlerts } from '../../api/mockData';
import Modal from '../../components/common/Modal';
import { Wrench, Plus, AlertTriangle, CheckCircle2, Shield, Calendar } from 'lucide-react';

export default function MaintenanceHub() {
  const toast = useToast();
  const [alerts, setAlerts] = useState(mockMaintenanceAlerts);
  const [modalOpen, setModalOpen] = useState(false);

  const [newMaint, setNewMaint] = useState({
    vehicleId: mockVehicles[1]._id,
    type: 'OIL_CHANGE',
    title: 'Periodic Engine Oil & Filter Change',
    dueDate: '2026-09-30',
    cost: 3500,
  });

  const handleAddMaintenance = (e) => {
    e.preventDefault();
    const v = mockVehicles.find((veh) => veh._id === newMaint.vehicleId) || mockVehicles[0];
    const item = {
      _id: 'maint_' + Date.now(),
      vehicle: v,
      type: newMaint.type,
      title: newMaint.title,
      dueDate: newMaint.dueDate,
      cost: Number(newMaint.cost),
      status: 'SCHEDULED',
      priority: 'MEDIUM',
    };
    setAlerts((prev) => [item, ...prev]);
    toast.success('Maintenance scheduled! Availability window blocked for this vehicle.');
    setModalOpen(false);
  };

  const handleComplete = (id) => {
    setAlerts((prev) =>
      prev.map((al) => (al._id === id ? { ...al, status: 'COMPLETED' } : al))
    );
    toast.success('Maintenance marked completed! Vehicle released back to available fleet.');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Fleet Maintenance & Compliance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track periodic service intervals, oil changes, insurance renewals, and PUC expiry dates.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Service</span>
        </button>
      </div>

      {/* Grid of alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {alerts.map((al) => (
          <div
            key={al._id}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                  {al.type}
                </span>
                <span className="text-xs text-slate-400 font-semibold">Due: {al.dueDate}</span>
              </div>

              <h3 className="font-extrabold text-slate-900 text-base mt-2">{al.title}</h3>

              <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                <span className="font-bold text-slate-900">
                  {al.vehicle?.make} {al.vehicle?.model}
                </span>
                <span className="font-mono text-slate-400 font-semibold">
                  ({al.vehicle?.registrationNumber})
                </span>
              </div>

              <p className="text-xs font-bold text-slate-800 mt-3">
                Estimated Cost: {formatCurrency(al.cost)}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  al.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {al.status}
              </span>

              {al.status !== 'COMPLETED' && (
                <button
                  onClick={() => handleComplete(al._id)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Completed</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Service Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Vehicle Maintenance">
        <form onSubmit={handleAddMaintenance} className="space-y-4 text-xs">
          <div>
            <label className="font-bold uppercase text-slate-700 block mb-1">Select Vehicle</label>
            <select
              value={newMaint.vehicleId}
              onChange={(e) => setNewMaint({ ...newMaint, vehicleId: e.target.value })}
              className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
            >
              {mockVehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.make} {v.model} ({v.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Service Type</label>
              <select
                value={newMaint.type}
                onChange={(e) => setNewMaint({ ...newMaint, type: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-2 font-semibold"
              >
                <option value="SERVICE">Scheduled Service</option>
                <option value="OIL_CHANGE">Oil & Filter Change</option>
                <option value="TYRE_REPLACEMENT">Tyre Replacement</option>
                <option value="BRAKE_SERVICE">Brake Service</option>
                <option value="INSURANCE">Insurance Renewal</option>
                <option value="PUC">PUC Certificate Renewal</option>
              </select>
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Estimated Cost (₹)</label>
              <input
                type="number"
                value={newMaint.cost}
                onChange={(e) => setNewMaint({ ...newMaint, cost: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold uppercase text-slate-700 block mb-1">Due Date</label>
            <input
              type="date"
              value={newMaint.dueDate}
              onChange={(e) => setNewMaint({ ...newMaint, dueDate: e.target.value })}
              className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-bold"
              required
            />
          </div>

          <div>
            <label className="font-bold uppercase text-slate-700 block mb-1">Task Title / Details</label>
            <input
              type="text"
              value={newMaint.title}
              onChange={(e) => setNewMaint({ ...newMaint, title: e.target.value })}
              placeholder="e.g. 20,000 KM Engine Flush & Alignment"
              className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold"
            >
              Schedule Maintenance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

