import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { mockBookings } from '../../api/mockData';
import Modal from '../../components/common/Modal';
import {
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';

export default function PaymentLedger() {
  const toast = useToast();
  const [payments, setPayments] = useState([
    {
      id: 'pay_1',
      bookingNumber: 'CR-2026-000101',
      customer: 'Neha Sharma',
      kind: 'RENTAL',
      amount: 12532,
      method: 'UPI',
      status: 'PAID',
      date: '2026-09-08',
      reference: 'UPI/328941092831',
    },
    {
      id: 'pay_2',
      bookingNumber: 'CR-2026-000098',
      customer: 'Neha Sharma',
      kind: 'DEPOSIT_REFUND',
      amount: 7000,
      method: 'BANK_TRANSFER',
      status: 'PAID',
      date: '2026-09-05',
      reference: 'REF/IMPS/9812401',
    },
    {
      id: 'pay_3',
      bookingNumber: 'CR-2026-000105',
      customer: 'Arjun Patel',
      kind: 'RENTAL',
      amount: 23364,
      method: 'CASH',
      status: 'PAID',
      date: '2026-09-09',
      reference: 'COUNTER/CASH/IND',
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newPay, setNewPay] = useState({
    bookingNumber: 'CR-2026-000105',
    customer: 'Arjun Patel',
    kind: 'RENTAL',
    amount: 5000,
    method: 'UPI',
    reference: '',
  });

  const handleRecordPayment = (e) => {
    e.preventDefault();
    const item = {
      id: 'pay_' + Date.now(),
      ...newPay,
      amount: Number(newPay.amount),
      status: 'PAID',
      date: new Date().toISOString().split('T')[0],
    };
    setPayments((prev) => [item, ...prev]);
    toast.success(`Recorded ${formatCurrency(item.amount)} payment via ${item.method}`);
    setModalOpen(false);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Financial & Payment Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit rental receipts, UPI transactions, security deposit escrow, and customer refunds.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Record Counter Payment</span>
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px] text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4">Txn ID / Ref</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Booking #</th>
              <th className="p-4">Kind</th>
              <th className="p-4">Payment Method</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="p-4 font-mono font-semibold text-slate-600">
                  {p.reference || p.id}
                </td>
                <td className="p-4 font-bold text-slate-900">{p.customer}</td>
                <td className="p-4 font-mono font-bold text-brand-600">{p.bookingNumber}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      p.kind === 'DEPOSIT_REFUND'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {p.kind.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 font-bold text-slate-800">{p.method}</td>
                <td className="p-4 font-black text-slate-900">
                  {p.kind === 'DEPOSIT_REFUND' ? (
                    <span className="text-rose-600">-{formatCurrency(p.amount)}</span>
                  ) : (
                    <span className="text-emerald-600">+{formatCurrency(p.amount)}</span>
                  )}
                </td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-slate-500">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Manual Payment">
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Booking #</label>
              <input
                type="text"
                value={newPay.bookingNumber}
                onChange={(e) => setNewPay({ ...newPay, bookingNumber: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Customer Name</label>
              <input
                type="text"
                value={newPay.customer}
                onChange={(e) => setNewPay({ ...newPay, customer: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Kind</label>
              <select
                value={newPay.kind}
                onChange={(e) => setNewPay({ ...newPay, kind: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-2 font-semibold"
              >
                <option value="RENTAL">RENTAL</option>
                <option value="DEPOSIT">DEPOSIT</option>
                <option value="EXTRA_CHARGES">EXTRA_CHARGES</option>
                <option value="DEPOSIT_REFUND">DEPOSIT_REFUND</option>
              </select>
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Amount (₹)</label>
              <input
                type="number"
                value={newPay.amount}
                onChange={(e) => setNewPay({ ...newPay, amount: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-3 font-bold"
                required
              />
            </div>
            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Method</label>
              <select
                value={newPay.method}
                onChange={(e) => setNewPay({ ...newPay, method: e.target.value })}
                className="w-full h-10 bg-slate-50 border rounded-xl px-2 font-semibold"
              >
                <option value="UPI">UPI</option>
                <option value="CASH">CASH</option>
                <option value="CARD">CARD (POS)</option>
                <option value="BANK_TRANSFER">BANK TRANSFER</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold uppercase text-slate-700 block mb-1">Transaction Ref / Notes</label>
            <input
              type="text"
              value={newPay.reference}
              onChange={(e) => setNewPay({ ...newPay, reference: e.target.value })}
              placeholder="e.g. UPI Ref / Cash receipt number"
              className="w-full h-10 bg-slate-50 border rounded-xl px-3"
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
              Record Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

