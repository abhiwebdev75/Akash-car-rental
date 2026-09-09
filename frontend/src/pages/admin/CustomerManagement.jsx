import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import {
  Users,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  Mail,
  Phone,
} from 'lucide-react';

export default function CustomerManagement() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [kycModalOpen, setKycModalOpen] = useState(false);

  const [customers, setCustomers] = useState([
    {
      id: 'cust_1',
      name: 'Neha Sharma',
      email: 'neha@example.com',
      phone: '+91 90000 10001',
      totalBookings: 5,
      totalSpend: 54800,
      licenseNumber: 'KA01 20210009876',
      kycStatus: 'VERIFIED',
      joinedAt: '2026-06-12',
    },
    {
      id: 'cust_2',
      name: 'Arjun Patel',
      email: 'arjun@example.com',
      phone: '+91 90000 10002',
      totalBookings: 2,
      totalSpend: 31200,
      licenseNumber: 'KA04 20200004581',
      kycStatus: 'PENDING',
      joinedAt: '2026-08-01',
    },
    {
      id: 'cust_3',
      name: 'Fatima Sheikh',
      email: 'fatima@example.com',
      phone: '+91 90000 10003',
      totalBookings: 3,
      totalSpend: 28400,
      licenseNumber: 'MH02 20190003412',
      kycStatus: 'VERIFIED',
      joinedAt: '2026-07-19',
    },
  ]);

  const handleUpdateKyc = (status) => {
    if (!selectedCustomer) return;
    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedCustomer.id ? { ...c, kycStatus: status } : c))
    );
    toast.success(`Customer KYC ${status === 'VERIFIED' ? 'Approved' : 'Rejected'}!`);
    setKycModalOpen(false);
  };

  const filtered = customers.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Customer Directory & KYC Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review submitted Driving Licenses, identity proofs, and lifetime customer rental spend.
          </p>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-9 pr-3 text-xs font-semibold text-slate-800 shadow-sm"
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px] text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4">Customer</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4">Driving License</th>
              <th className="p-4">Total Trips</th>
              <th className="p-4">Lifetime Spend</th>
              <th className="p-4">KYC Status</th>
              <th className="p-4 text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="p-4">
                  <span className="font-extrabold text-slate-900 text-sm block">{c.name}</span>
                  <span className="text-[11px] text-slate-400">Member since {c.joinedAt}</span>
                </td>
                <td className="p-4 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.phone}</span>
                  </div>
                </td>
                <td className="p-4 font-mono font-bold text-slate-800">{c.licenseNumber}</td>
                <td className="p-4 font-extrabold text-slate-900">{c.totalBookings} rentals</td>
                <td className="p-4 font-black text-slate-900">{formatCurrency(c.totalSpend)}</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.kycStatus === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : c.kycStatus === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {c.kycStatus}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => {
                      setSelectedCustomer(c);
                      setKycModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-brand-600 font-bold transition-all inline-flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Review KYC</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* KYC Review Modal */}
      <Modal isOpen={kycModalOpen} onClose={() => setKycModalOpen(false)} title={`KYC Document Review — ${selectedCustomer?.name}`}>
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            <p><strong>Customer Name:</strong> {selectedCustomer?.name}</p>
            <p><strong>Driving License Number:</strong> <span className="font-mono font-bold">{selectedCustomer?.licenseNumber}</span></p>
            <p><strong>Phone:</strong> {selectedCustomer?.phone}</p>
          </div>

          {/* Sample Document Preview */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-100 text-center space-y-2">
            <FileText className="w-8 h-8 text-brand-600 mx-auto" />
            <p className="font-bold text-slate-800">Original Driving License Scan Attached</p>
            <p className="text-[11px] text-slate-500">Document status is currently: <strong>{selectedCustomer?.kycStatus}</strong></p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleUpdateKyc('REJECTED')}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200"
            >
              Reject Document
            </button>
            <button
              type="button"
              onClick={() => handleUpdateKyc('VERIFIED')}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Approve & Verify KYC
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

