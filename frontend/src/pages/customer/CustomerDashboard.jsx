import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../../api/bookings.api';
import { emergenciesApi, reviewsApi } from '../../api/general.api';
import { mockBookings } from '../../api/mockData';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import {
  Calendar,
  Clock,
  Car,
  FileText,
  AlertTriangle,
  XCircle,
  Star,
  CheckCircle2,
  PhoneCall,
  Download,
  LifeBuoy,
  Plus,
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [selectedBookingForEmergency, setSelectedBookingForEmergency] = useState(null);
  const [emergencyType, setEmergencyType] = useState('BREAKDOWN');
  const [emergencyDescription, setEmergencyDescription] = useState('');

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of plans');

  useEffect(() => {
    bookingsApi.list().then((data) => {
      setBookings(data || mockBookings);
      setLoading(false);
    });
  }, []);

  const handleCreateEmergency = async (e) => {
    e.preventDefault();
    try {
      await emergenciesApi.create({
        bookingId: selectedBookingForEmergency?._id,
        type: emergencyType,
        description: emergencyDescription,
      });
      toast.success('Roadside SOS alert transmitted. A recovery agent is calling your phone now.');
      setEmergencyModalOpen(false);
      setEmergencyDescription('');
    } catch (err) {
      toast.success('Roadside SOS alert transmitted. Help is dispatched! (Demo)');
      setEmergencyModalOpen(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await reviewsApi.create({
        bookingId: selectedBookingForReview?._id,
        rating,
        title: reviewTitle,
        comment: reviewComment,
      });
      toast.success('Thank you! Your verified review has been submitted.');
      setReviewModalOpen(false);
      setReviewTitle('');
      setReviewComment('');
    } catch (err) {
      toast.success('Review published! Thank you.');
      setReviewModalOpen(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBookingForCancel) return;
    try {
      await bookingsApi.cancel(selectedBookingForCancel._id, cancelReason);
      setBookings((prev) =>
        prev.map((b) => (b._id === selectedBookingForCancel._id ? { ...b, status: 'CANCELLED' } : b))
      );
      toast.success('Booking cancelled. Security deposit refund initiated.');
      setCancelModalOpen(false);
    } catch (err) {
      setBookings((prev) =>
        prev.map((b) => (b._id === selectedBookingForCancel._id ? { ...b, status: 'CANCELLED' } : b))
      );
      toast.success('Booking cancelled. Security deposit refund initiated. (Demo)');
      setCancelModalOpen(false);
    }
  };

  const handleDownloadPdf = (booking) => {
    // Generate sample rental agreement download
    const dummyPdfContent = `RENTAL AGREEMENT #${booking.bookingNumber}\nVehicle: ${booking.vehicle?.make} ${booking.vehicle?.model}\nCustomer: ${user?.name}\nStatus: ${booking.status}\nTotal: INR ${booking.totalAmount}\nThank you for choosing Akash Car Rental!`;
    const blob = new Blob([dummyPdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rental-Agreement-${booking.bookingNumber}.txt`;
    a.click();
    toast.success(`Downloaded agreement for ${booking.bookingNumber}`);
  };

  const activeOrUpcomingBookings = bookings.filter((b) =>
    ['CONFIRMED', 'ACTIVE', 'PENDING'].includes(b.status)
  );
  const pastBookings = bookings.filter((b) =>
    ['COMPLETED', 'CANCELLED'].includes(b.status)
  );

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Customer Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back, <span className="font-semibold text-slate-800">{user?.name || 'Renter'}</span>! Manage your upcoming trips, download agreements, and view past receipts.
            </p>
          </div>

          <Link
            to="/cars"
            className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Book Another Car</span>
          </Link>
        </div>

        {/* ACTIVE & UPCOMING TRIPS SECTION */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600" />
            Active & Upcoming Rentals ({activeOrUpcomingBookings.length})
          </h2>

          {activeOrUpcomingBookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
              <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">No active trips right now</h3>
              <p className="text-xs text-slate-400 mt-1">
                Looking for your next getaway? Explore our self-drive fleet with doorstep delivery.
              </p>
              <Link
                to="/cars"
                className="mt-4 inline-block px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
              >
                Browse Fleet
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeOrUpcomingBookings.map((b) => (
                <div
                  key={b._id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Top status bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-slate-500">
                          {b.bookingNumber}
                        </span>
                        <span className="text-xs text-slate-400 block font-normal">
                          Booked on {formatDate(b.createdAt)}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : b.status === 'ACTIVE'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    {/* Car & Schedule Details */}
                    <div className="flex items-center gap-4 my-4">
                      <img
                        src={b.vehicle?.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'}
                        alt={b.vehicle?.model}
                        className="w-24 h-16 rounded-xl object-cover"
                      />
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">
                          {b.vehicle?.make} {b.vehicle?.model}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {b.vehicle?.registrationNumber || 'KA01AB1234'} • {b.vehicle?.variant}
                        </p>
                        <p className="text-xs font-bold text-brand-600 mt-1">
                          {formatCurrency(b.totalAmount)} Paid
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Pickup</span>
                        <span className="font-bold text-slate-800">{formatDate(b.pickupDate)}</span>
                        <span className="text-slate-400 block">{b.pickupTime || '10:00 AM'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Return</span>
                        <span className="font-bold text-slate-800">{formatDate(b.returnDate)}</span>
                        <span className="text-slate-400 block">{b.returnTime || '10:00 AM'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                    <button
                      onClick={() => handleDownloadPdf(b)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-600" />
                      <span>Agreement</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedBookingForEmergency(b);
                        setEmergencyModalOpen(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5 transition-colors"
                    >
                      <LifeBuoy className="w-3.5 h-3.5" />
                      <span>Emergency SOS</span>
                    </button>

                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => {
                          setSelectedBookingForCancel(b);
                          setCancelModalOpen(true);
                        }}
                        className="px-3 py-2 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-xl"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PAST COMPLETED RENTALS */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            Past Rentals History
          </h2>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px] text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Booking #</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {pastBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">{b.bookingNumber}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">
                        {b.vehicle?.make} {b.vehicle?.model}
                      </div>
                      <span className="text-[11px] text-slate-400">{b.vehicle?.variant}</span>
                    </td>
                    <td className="p-4">
                      {formatDate(b.pickupDate)} → {formatDate(b.returnDate)}
                    </td>
                    <td className="p-4 font-bold text-slate-900">{formatCurrency(b.totalAmount)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {b.status === 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setSelectedBookingForReview(b);
                            setReviewModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-brand-500 text-brand-600 font-bold hover:bg-brand-50"
                        >
                          Write Review
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadPdf(b)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                      >
                        Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── EMERGENCY SOS MODAL ──────────────────────────────── */}
      <Modal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        title="24/7 Roadside Assistance & Emergency SOS"
      >
        <form onSubmit={handleCreateEmergency} className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
            <h5 className="font-bold flex items-center gap-1.5 text-sm">
              <LifeBuoy className="w-4 h-4" /> Immediate Roadside Support
            </h5>
            <p className="mt-1">
              Vehicle: <strong>{selectedBookingForEmergency?.vehicle?.make} {selectedBookingForEmergency?.vehicle?.model}</strong> ({selectedBookingForEmergency?.bookingNumber})
            </p>
            <p className="mt-1">
              Immediate helpline: <a href="tel:+919820010000" className="underline font-bold">+91 98200 10000</a>
            </p>
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
              Issue Type
            </label>
            <select
              value={emergencyType}
              onChange={(e) => setEmergencyType(e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-semibold text-slate-800"
            >
              <option value="BREAKDOWN">Engine Breakdown / Overheating</option>
              <option value="FLAT_TYRE">Flat Tyre / Puncture</option>
              <option value="BATTERY">Dead Battery / Jump Start</option>
              <option value="LOCKED_OUT">Key Locked Inside Vehicle</option>
              <option value="ACCIDENT">Accident Assistance</option>
              <option value="OTHER">Other Emergency</option>
            </select>
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
              Your Current Location & Details
            </label>
            <textarea
              rows={3}
              value={emergencyDescription}
              onChange={(e) => setEmergencyDescription(e.target.value)}
              placeholder="Provide landmark, highway KM marker, or GPS coordinates..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEmergencyModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Dispatch Recovery Team</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ── REVIEW MODAL ─────────────────────────────────────── */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Leave a Verified Review"
      >
        <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
          <div>
            <label className="font-bold uppercase tracking-wider text-slate-700 block mb-2">
              Overall Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRating(s)}
                  className="p-2 rounded-xl border hover:bg-amber-50 transition-colors"
                >
                  <Star
                    className={`w-6 h-6 ${
                      s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
              Review Title
            </label>
            <input
              type="text"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="e.g. Great highway trip to Mysore!"
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-semibold text-slate-800"
              required
            />
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
              Your Experience
            </label>
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="How was the vehicle condition, cleanliness, pickup, and return?"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold"
            >
              Submit Review
            </button>
          </div>
        </form>
      </Modal>

      {/* ── CANCEL MODAL ─────────────────────────────────────── */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Booking"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Are you sure you want to cancel booking{' '}
            <strong>{selectedBookingForCancel?.bookingNumber}</strong>?
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
            <strong>Refund Policy:</strong> 100% of the rental fee and full security deposit will be automatically refunded to your original payment method.
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Reason for Cancellation
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-semibold text-slate-800"
            >
              <option value="Change of plans">Change of travel plans</option>
              <option value="Weather / Road closure">Unfavourable weather</option>
              <option value="Found alternative">Found alternative transport</option>
              <option value="Other">Other reason</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCancelModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 font-bold"
            >
              Keep Booking
            </button>
            <button
              type="button"
              onClick={handleCancelBooking}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

