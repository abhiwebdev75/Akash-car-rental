import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { mockDemoUsers, mockLocations } from '../../api/mockData';
import Modal from '../../components/common/Modal';
import { UserCheck, Plus, Shield, Mail, Phone, MapPin } from 'lucide-react';

export default function StaffManagement() {
  const toast = useToast();
  const [staffList, setStaffList] = useState([
    {
      id: 'st_1',
      name: 'Priya Nair',
      email: 'priya.manager@driveeasy.example',
      phone: '+91 90000 00002',
      role: 'MANAGER',
      location: 'Bengaluru — Indiranagar',
      status: 'ACTIVE',
    },
    {
      id: 'st_2',
      name: 'Rohan Gupta',
      email: 'rohan.manager@driveeasy.example',
      phone: '+91 90000 00003',
      role: 'MANAGER',
      location: 'Mysuru — City Centre',
      status: 'ACTIVE',
    },
    {
      id: 'st_3',
      name: 'Sana Khan',
      email: 'sana.staff@driveeasy.example',
      phone: '+91 90000 00004',
      role: 'STAFF',
      location: 'Bengaluru — Indiranagar',
      status: 'ACTIVE',
    },
    {
      id: 'st_4',
      name: 'Vikram Rao',
      email: 'vikram.accounts@driveeasy.example',
      phone: '+91 90000 00005',
      role: 'ACCOUNTANT',
      location: 'All Locations',
      status: 'ACTIVE',
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'STAFF',
    location: 'Bengaluru — Indiranagar',
  });

  const handleAddStaff = (e) => {
    e.preventDefault();
    const item = {
      id: 'st_' + Date.now(),
      ...newStaff,
      status: 'ACTIVE',
    };
    setStaffList((prev) => [item, ...prev]);
    toast.success(`Staff account created for ${item.name} (${item.role})`);
    setModalOpen(false);
  };

  const handleToggleStatus = (id) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : s))
    );
    toast.success('Staff account status updated!');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            Staff & Role-Based Access Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Owner Only: Assign Managers to hubs, configure check-in Staff, and add Accountants.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px] text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4">Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Role</th>
              <th className="p-4">Assigned Location</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {staffList.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="p-4 font-bold text-slate-900 text-sm">{s.name}</td>
                <td className="p-4 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.phone}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                    {s.role}
                  </span>
                </td>
                <td className="p-4 font-semibold text-slate-800">{s.location}</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      s.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleToggleStatus(s.id)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-700"
                  >
                    {s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Staff Member">
        <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
          <div>
            <label className="font-bold uppercase text-slate-700 block mb-1">Full Name</label>
            <input
              type="text"
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
                required
              />
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Phone</label>
              <input
                type="tel"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Role</label>
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-2 font-semibold"
              >
                <option value="MANAGER">MANAGER (Hub operations)</option>
                <option value="STAFF">STAFF (Check-in & Inspections)</option>
                <option value="ACCOUNTANT">ACCOUNTANT (Financial ledger)</option>
              </select>
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Assigned Location</label>
              <select
                value={newStaff.location}
                onChange={(e) => setNewStaff({ ...newStaff, location: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-2 font-semibold"
              >
                {mockLocations.map((l) => (
                  <option key={l._id} value={l.name}>{l.name}</option>
                ))}
                <option value="All Locations">All Locations (Headquarters)</option>
              </select>
            </div>
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
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

