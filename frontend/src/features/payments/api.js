import { apiClient } from '../../lib/apiClient';

// Payments live against a booking (there is no global ledger endpoint). The
// backend is authoritative for all balance math and payment status.
export const paymentsApi = {
  // Ledger for a booking (newest first).
  async listByBooking(bookingId) {
    const { data } = await apiClient.get(`/payments/booking/${bookingId}`);
    return data.data;
  },

  // { totalAmount, amountPaid, amountRemaining, paymentStatus }
  async balance(bookingId) {
    const { data } = await apiClient.get(`/payments/booking/${bookingId}/balance`);
    return data.data;
  },

  // Record money IN. payload: { bookingId, amount, kind, method, transactionRef?, notes? }
  // Returns { payment, booking }.
  async record(payload) {
    const { data } = await apiClient.post('/payments', payload);
    return data.data;
  },

  // Record money OUT (finance only). payload: { bookingId, amount, kind, method, notes? }
  async refund(payload) {
    const { data } = await apiClient.post('/payments/refund', payload);
    return data.data;
  },
};
