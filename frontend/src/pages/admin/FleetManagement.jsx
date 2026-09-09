import React, { useState, useEffect } from 'react';
import { vehiclesApi } from '../../api/vehicles.api';
import { mockVehicles, mockLocations } from '../../api/mockData';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import {
  Car,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ArrowLeftRight,
  CheckCircle2,
  Wrench,
  AlertCircle,
} from 'lucide-react';

export default function FleetManagement() {
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // New vehicle form state
  const [newVehicle, setNewVehicle] = useState({
    make: '',
    model: '',
    variant: '',
    year: 2024,
    registrationNumber: '',
    type: 'SUV',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    seats: 5,
    dailyPrice: 3000,
    securityDeposit: 6000,
    locationId: 'loc_blr_1',
  });

  const [newStatus, setNewStatus] = useState('AVAILABLE');
  const [targetLocation, setTargetLocation] = useState('loc_mys_1');

  useEffect(() => {
    vehiclesApi.adminList().then((data) => {
      setVehicles(data || mockVehicles);
    });
  }, []);

  const handleAddVehicle = (e) => {
    e.preventDefault();
    const created = {
      _id: 'veh_' + Date.now(),
      make: newVehicle.make,
      model: newVehicle.model,
      variant: newVehicle.variant,
      year: Number(newVehicle.year),
      registrationNumber: newVehicle.registrationNumber.toUpperCase(),
      type: newVehicle.type,
      transmission: newVehicle.transmission,
      fuelType: newVehicle.fuelType,
      seats: Number(newVehicle.seats),
      pricing: {
        daily: Number(newVehicle.dailyPrice),
        weekly: Number(newVehicle.dailyPrice) * 6,
        monthly: Number(newVehicle.dailyPrice) * 22,
        extraKmCharge: 15,
        freeKmPerDay: 250,
      },
      securityDeposit: Number(newVehicle.securityDeposit),
      status: 'AVAILABLE',
      locationId: newVehicle.locationId,
      images: [
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      ],
      features: ['Airbags', 'Fastag', 'Reverse Camera'],
    };

    setVehicles((prev) => [created, ...prev]);
    toast.success(`${created.make} ${created.model} added to fleet!`);
    setAddModalOpen(false);
  };

  const handleUpdateStatus = () => {
    if (!selectedVehicle) return;
    setVehicles((prev) =>
      prev.map((v) => (v._id === selectedVehicle._id ? { ...v, status: newStatus } : v))
    );
    toast.success(`Updated ${selectedVehicle.model} status to ${newStatus}`);
    setStatusModalOpen(false);
  };

  const handleTransferLocation = () => {
    if (!selectedVehicle) return;
    setVehicles((prev) =>
      prev.map((v) => (v._id === selectedVehicle._id ? { ...v, locationId: targetLocation } : v))
    );
    const locName = mockLocations.find((l) => l._id === targetLocation)?.name;
    toast.success(`Transferred ${selectedVehicle.model} to ${locName}`);
    setTransferModalOpen(false);
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (filterLocation !== 'ALL' && v.locationId !== filterLocation) return false;
    if (filterStatus !== 'ALL' && v.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.registrationNumber.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Fleet Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage vehicles, update availability statuses, and initiate inter-hub transfers.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by make, model, or KA number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs text-slate-800"
          />
        </div>

        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700"
        >
          <option value="ALL">All Hubs</option>
          {mockLocations.map((l) => (
            <option key={l._id} value={l._id}>{l.name}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700"
        >
          <option value="ALL">All Statuses</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="BOOKED">BOOKED</option>
          <option value="RENTED">RENTED</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      {/* Fleet Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px] text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4">Vehicle Details</th>
              <th className="p-4">Reg Number</th>
              <th className="p-4">Location Hub</th>
              <th className="p-4">Daily Rate</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredVehicles.map((v) => {
              const loc = mockLocations.find((l) => l._id === v.locationId);
              return (
                <tr key={v._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={v.images?.[0]}
                        alt={v.model}
                        className="w-14 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm block">
                          {v.make} {v.model}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {v.variant} • {v.year} • {v.type} • {v.transmission}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-800">
                    {v.registrationNumber}
                  </td>
                  <td className="p-4 font-semibold text-slate-700">
                    {loc ? loc.name : 'Indiranagar'}
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    {formatCurrency(v.pricing?.daily)} / day
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : v.status === 'BOOKED' || v.status === 'RENTED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedVehicle(v);
                        setNewStatus(v.status);
                        setStatusModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 transition-colors"
                      title="Change Status"
                    >
                      Status
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVehicle(v);
                        setTargetLocation(v.locationId === 'loc_blr_1' ? 'loc_mys_1' : 'loc_blr_1');
                        setTransferModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-brand-50 hover:text-brand-600 font-bold text-slate-700 transition-colors"
                      title="Transfer Hub"
                    >
                      Transfer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── ADD VEHICLE MODAL ────────────────────────────────── */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Vehicle to Fleet">
        <form onSubmit={handleAddVehicle} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Make</label>
              <input
                type="text"
                value={newVehicle.make}
                onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                placeholder="e.g. Hyundai"
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
                required
              />
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Model</label>
              <input
                type="text"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                placeholder="e.g. Verna"
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Variant</label>
              <input
                type="text"
                value={newVehicle.variant}
                onChange={(e) => setNewVehicle({ ...newVehicle, variant: e.target.value })}
                placeholder="SX (O)"
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
                required
              />
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Year</label>
              <input
                type="number"
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
                required
              />
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Reg Number</label>
              <input
                type="text"
                value={newVehicle.registrationNumber}
                onChange={(e) => setNewVehicle({ ...newVehicle, registrationNumber: e.target.value })}
                placeholder="KA01AB9999"
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-mono font-bold uppercase"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Type</label>
              <select
                value={newVehicle.type}
                onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-2 font-semibold"
              >
                <option value="HATCHBACK">HATCHBACK</option>
                <option value="SEDAN">SEDAN</option>
                <option value="SUV">SUV</option>
                <option value="MUV">MUV</option>
                <option value="LUXURY">LUXURY</option>
              </select>
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Transmission</label>
              <select
                value={newVehicle.transmission}
                onChange={(e) => setNewVehicle({ ...newVehicle, transmission: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-2 font-semibold"
              >
                <option value="AUTOMATIC">AUTOMATIC</option>
                <option value="MANUAL">MANUAL</option>
              </select>
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Fuel</label>
              <select
                value={newVehicle.fuelType}
                onChange={(e) => setNewVehicle({ ...newVehicle, fuelType: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-2 font-semibold"
              >
                <option value="PETROL">PETROL</option>
                <option value="DIESEL">DIESEL</option>
                <option value="ELECTRIC">ELECTRIC</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Daily Price (₹)</label>
              <input
                type="number"
                value={newVehicle.dailyPrice}
                onChange={(e) => setNewVehicle({ ...newVehicle, dailyPrice: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
                required
              />
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Security Deposit</label>
              <input
                type="number"
                value={newVehicle.securityDeposit}
                onChange={(e) => setNewVehicle({ ...newVehicle, securityDeposit: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
                required
              />
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Hub Location</label>
              <select
                value={newVehicle.locationId}
                onChange={(e) => setNewVehicle({ ...newVehicle, locationId: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-2 font-semibold"
              >
                {mockLocations.map((l) => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold"
            >
              Add Vehicle
            </button>
          </div>
        </form>
      </Modal>

      {/* ── UPDATE STATUS MODAL ──────────────────────────────── */}
      <Modal isOpen={statusModalOpen} onClose={() => setStatusModalOpen(false)} title="Change Vehicle Operational Status">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Set the operational status for <strong>{selectedVehicle?.make} {selectedVehicle?.model}</strong> ({selectedVehicle?.registrationNumber}).
          </p>

          <div>
            <label className="font-bold uppercase text-slate-700 block mb-1">New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-bold text-slate-800"
            >
              <option value="AVAILABLE">AVAILABLE (Ready for Booking)</option>
              <option value="BOOKED">BOOKED</option>
              <option value="RENTED">RENTED</option>
              <option value="MAINTENANCE">MAINTENANCE (Temporarily Unavailable)</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateStatus}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold"
            >
              Save Status
            </button>
          </div>
        </div>
      </Modal>

      {/* ── TRANSFER VEHICLE MODAL ───────────────────────────── */}
      <Modal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)} title="Inter-Hub Vehicle Transfer">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Transfer <strong>{selectedVehicle?.make} {selectedVehicle?.model}</strong> ({selectedVehicle?.registrationNumber}) to another operational hub.
          </p>

          <div>
            <label className="font-bold uppercase text-slate-700 block mb-1">Destination Hub</label>
            <select
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
              className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-bold text-slate-800"
            >
              {mockLocations.map((l) => (
                <option key={l._id} value={l._id}>{l.name} ({l.code})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTransferModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTransferLocation}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold"
            >
              Confirm Transfer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

