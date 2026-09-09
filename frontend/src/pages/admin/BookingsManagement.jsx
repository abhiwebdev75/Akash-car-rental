import React, { useState, useEffect } from 'react';
import { bookingsApi } from '../../api/bookings.api';
import { mockBookings } from '../../api/mockData';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Car,
  Key,
  Check,
  XCircle,
  Eye,
  FileText,
} from 'lucide-react';

export default function BookingsManagement() {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    bookingsApi.list().then((data) => {
      setBookings(data || mockBookings);
    });
  }, []);

  const handleStatusTransition = async (bookingId, action) => {
    let nextStatus = 'CONFIRMED';
    if (action === 'confirm') nextStatus = 'CONFIRMED';
    if (action === 'activate') nextStatus = 'ACTIVE';
    if (action === 'complete') nextStatus = 'COMPLETED';
    if (action === 'cancel') nextStatus = 'CANCELLED';

    try {
      if (action === 'confirm') await bookingsApi.confirm(bookingId);
      if (action === 'activate') await bookingsApi.activate(bookingId);
      if (action === 'complete') await bookingsApi.complete(bookingId);
      if (action === 'cancel') await bookingsApi.cancel(bookingId, 'Admin cancelled');

      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: nextStatus } : b))
      );
      toast.success(`Booking ${action}ed successfully!`);
    } catch (err) {
      // Mock fallback
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: nextStatus } : b))
      );
      toast.success(`Booking ${action}ed! (Demo Mode)`);
    }
  };

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        b.bookingNumber?.toLowerCase().includes(q) ||
        b.customer?.name?.toLowerCase().includes(q) ||
        b.vehicle?.model?.toLowerCase().includes(q);
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
            Bookings & Reservations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full lifecycle control: Confirm reservations, perform key handovers, and return check-ins.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-xs font-bold">
          {['ALL', 'PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                statusFilter === s
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search booking # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-9 pr-3 text-xs font-semibold text-slate-800"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[850px] text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4">Booking #</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Vehicle</th>
              <th className="p-4">Schedule</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.map((b) => (
              <tr key={b._id} className="hover:bg-slate-50/60 transition-colors">
                <td className="p-4 font-mono font-bold text-slate-900">
                  {b.bookingNumber}
                </td>
                <td className="p-4">
                  <span className="font-bold text-slate-900 block">{b.customer?.name}</span>
                  <span className="text-[11px] text-slate-400">{b.customer?.phone}</span>
                </td>
                <td className="p-4">
                  <span className="font-bold text-slate-900 block">
                    {b.vehicle?.make} {b.vehicle?.model}
                  </span>
                  <span className="text-[11px] text-slate-400">{b.vehicle?.registrationNumber}</span>
                </td>
                <td className="p-4">
                  <span className="block font-semibold">
                    {formatDate(b.pickupDate)} ({b.pickupTime || '10:00'})
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    to {formatDate(b.returnDate)}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-bold text-slate-900 block">{formatCurrency(b.totalAmount)}</span>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">{b.paymentStatus}</span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      b.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : b.status === 'ACTIVE'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : b.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-1.5">
                  {/* Transition buttons based on current state */}
                  {b.status === 'PENDING' && (
                    <button
                      onClick={() => handleStatusTransition(b._id, 'confirm')}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                    >
                      Confirm
                    </button>
                  )}

                  {b.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleStatusTransition(b._id, 'activate')}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex-inline items-center gap-1"
                    >
                      <Key className="w-3 h-3 inline mr-1" />
                      Handover
                    </button>
                  )}

                  {b.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleStatusTransition(b._id, 'complete')}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                    >
                      Complete Return
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedBooking(b);
                      setDetailModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 inline-block align-middle"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Booking Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Booking #${selectedBooking?.bookingNumber}`}
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Customer</span>
              <span className="font-bold text-slate-900 text-sm block">{selectedBooking?.customer?.name}</span>
              <span className="text-slate-500">{selectedBooking?.customer?.phone}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Vehicle</span>
              <span className="font-bold text-slate-900 text-sm block">
                {selectedBooking?.vehicle?.make} {selectedBooking?.vehicle?.model}
              </span>
              <span className="text-slate-500">{selectedBooking?.vehicle?.registrationNumber}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900">Financial Breakdown</h4>
            <div className="flex justify-between text-slate-600">
              <span>Rental Subtotal</span>
              <span className="font-bold">{formatCurrency(selectedBooking?.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Security Deposit</span>
              <span className="font-bold">
                {formatCurrency(selectedBooking?.pricingBreakdown?.securityDeposit || 5000)}
              </span>
            </div>
            <div className="flex justify-between text-emerald-600 font-bold pt-1 border-t">
              <span>Payment Status</span>
              <span>{selectedBooking?.paymentStatus}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

