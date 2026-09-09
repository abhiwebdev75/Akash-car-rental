import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { mockVehicles } from '../../api/mockData';
import Modal from '../../components/common/Modal';
import { AlertTriangle, Plus, Camera, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function DamageReports() {
  const toast = useToast();
  const [damages, setDamages] = useState([
    {
      id: 'dmg_1',
      vehicle: mockVehicles[0],
      severity: 'MINOR',
      part: 'Rear Bumper Left Corner',
      description: 'Minor parking scrape along the lower bumper lip.',
      repairCost: 1500,
      status: 'RESOLVED',
      date: '2026-08-25',
    },
    {
      id: 'dmg_2',
      vehicle: mockVehicles[3],
      severity: 'MODERATE',
      part: 'Passenger Side ORVM Mirror',
      description: 'Broken indicator lens on left wing mirror.',
      repairCost: 3200,
      status: 'REPAIRING',
      date: '2026-09-04',
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState(mockVehicles[0]._id);
  const [severity, setSeverity] = useState('MINOR');
  const [part, setPart] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState(1000);

  const handleCreateDamage = (e) => {
    e.preventDefault();
    const v = mockVehicles.find((veh) => veh._id === vehicleId) || mockVehicles[0];
    const newRecord = {
      id: 'dmg_' + Date.now(),
      vehicle: v,
      severity,
      part,
      description,
      repairCost: Number(cost),
      status: 'REPORTED',
      date: new Date().toISOString().split('T')[0],
    };
    setDamages((prev) => [newRecord, ...prev]);
    toast.success('Damage report filed and billed to customer deposit.');
    setModalOpen(false);
    setPart('');
    setDescription('');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Damage Reports & Deposit Claims
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log return damages, manage garage repair estimates, and deduct from deposit balance.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Damage</span>
        </button>
      </div>

      {/* Damage Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px] text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4">Vehicle</th>
              <th className="p-4">Severity</th>
              <th className="p-4">Damaged Part</th>
              <th className="p-4">Estimated Cost</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {damages.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="p-4">
                  <span className="font-bold text-slate-900 block">
                    {d.vehicle?.make} {d.vehicle?.model}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {d.vehicle?.registrationNumber}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      d.severity === 'MINOR'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : d.severity === 'MODERATE'
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {d.severity}
                  </span>
                </td>
                <td className="p-4 font-semibold text-slate-800">{d.part}</td>
                <td className="p-4 font-bold text-slate-900">{formatCurrency(d.repairCost)}</td>
                <td className="p-4 font-bold">
                  <span className="text-[10px] uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {d.status}
                  </span>
                </td>
                <td className="p-4 text-slate-500">{d.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Damage Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="File New Damage Report">
        <form onSubmit={handleCreateDamage} className="space-y-4 text-xs">
          <div>
            <label className="font-bold uppercase text-slate-700 block mb-1">Select Vehicle</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
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
              <label className="font-bold uppercase text-slate-700 block mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
              >
                <option value="MINOR">MINOR (Scratches / Paint chips)</option>
                <option value="MODERATE">MODERATE (Dents / Glass cracks)</option>
                <option value="SEVERE">SEVERE (Body structural damage)</option>
              </select>
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Repair Cost (₹)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold uppercase text-slate-700 block mb-1">Damaged Part / Location</label>
            <input
              type="text"
              value={part}
              onChange={(e) => setPart(e.target.value)}
              placeholder="e.g. Front Right Fender"
              className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
              required
            />
          </div>

          <div>
            <label className="font-bold uppercase text-slate-700 block mb-1">Damage Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how and where the damage is located..."
              className="w-full bg-slate-50 border rounded-xl p-3 font-medium"
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
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              File Damage Claim
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

