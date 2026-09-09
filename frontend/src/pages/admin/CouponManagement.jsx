import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { mockCoupons } from '../../api/mockData';
import Modal from '../../components/common/Modal';
import { Tag, Plus, CheckCircle2, XCircle } from 'lucide-react';

export default function CouponManagement() {
  const toast = useToast();
  const [coupons, setCoupons] = useState(mockCoupons);
  const [modalOpen, setModalOpen] = useState(false);

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: 10,
    maximumDiscount: 1500,
    minimumRental: 2500,
    description: '',
  });

  const handleCreateCoupon = (e) => {
    e.preventDefault();
    const created = {
      _id: 'coup_' + Date.now(),
      code: newCoupon.code.toUpperCase(),
      type: newCoupon.type,
      value: Number(newCoupon.value),
      maximumDiscount: Number(newCoupon.maximumDiscount),
      minimumRental: Number(newCoupon.minimumRental),
      description: newCoupon.description,
      active: true,
    };
    setCoupons((prev) => [created, ...prev]);
    toast.success(`Promo code ${created.code} activated!`);
    setModalOpen(false);
  };

  const handleToggleActive = (id) => {
    setCoupons((prev) =>
      prev.map((c) => (c._id === id ? { ...c, active: !c.active } : c))
    );
    toast.success('Coupon status updated!');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Promotional Coupons & Discounts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure percentage discounts, flat cashback, minimum rental thresholds, and discount caps.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px] text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4">Promo Code</th>
              <th className="p-4">Discount Value</th>
              <th className="p-4">Min Rental</th>
              <th className="p-4">Max Cap</th>
              <th className="p-4">Description</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {coupons.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                <td className="p-4 font-mono font-black text-sm text-brand-600 tracking-wider">
                  {c.code}
                </td>
                <td className="p-4 font-extrabold text-slate-900">
                  {c.type === 'PERCENTAGE' ? `${c.value}% OFF` : `₹${c.value} FLAT`}
                </td>
                <td className="p-4 font-semibold">{formatCurrency(c.minimumRental)}</td>
                <td className="p-4 font-semibold">{c.maximumDiscount ? formatCurrency(c.maximumDiscount) : 'No Cap'}</td>
                <td className="p-4 text-slate-500 max-w-xs truncate">{c.description}</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {c.active ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleToggleActive(c._id)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-700"
                  >
                    {c.active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Coupon Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Promotional Coupon">
        <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Coupon Code</label>
              <input
                type="text"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                placeholder="e.g. MONSOON20"
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-mono font-bold uppercase"
                required
              />
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Type</label>
              <select
                value={newCoupon.type}
                onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-2 font-semibold"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Value</label>
              <input
                type="number"
                value={newCoupon.value}
                onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-bold"
                required
              />
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Max Cap (₹)</label>
              <input
                type="number"
                value={newCoupon.maximumDiscount}
                onChange={(e) => setNewCoupon({ ...newCoupon, maximumDiscount: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-bold"
              />
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Min Rental (₹)</label>
              <input
                type="number"
                value={newCoupon.minimumRental}
                onChange={(e) => setNewCoupon({ ...newCoupon, minimumRental: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold uppercase text-slate-700 block mb-1">Description</label>
            <input
              type="text"
              value={newCoupon.description}
              onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
              placeholder="e.g. 10% off on all long-weekend bookings"
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
              Create Coupon
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

