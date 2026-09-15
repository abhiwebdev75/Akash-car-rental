import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from './api';

export function usePayments(bookingId) {
  return useQuery({
    queryKey: ['payments', 'booking', bookingId],
    queryFn: () => paymentsApi.listByBooking(bookingId),
    enabled: !!bookingId,
  });
}

export function usePaymentBalance(bookingId) {
  return useQuery({
    queryKey: ['payments', 'balance', bookingId],
    queryFn: () => paymentsApi.balance(bookingId),
    enabled: !!bookingId,
  });
}

// After any payment/refund, the booking's amountPaid + paymentStatus change, so
// invalidate the booking views alongside the payment ledger.
function invalidateAfterPayment(qc, bookingId) {
  qc.invalidateQueries({ queryKey: ['payments', 'booking', bookingId] });
  qc.invalidateQueries({ queryKey: ['payments', 'balance', bookingId] });
  qc.invalidateQueries({ queryKey: ['bookings'] });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => paymentsApi.record(payload),
    onSuccess: (_data, variables) => invalidateAfterPayment(qc, variables.bookingId),
  });
}

export function useRefundPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => paymentsApi.refund(payload),
    onSuccess: (_data, variables) => invalidateAfterPayment(qc, variables.bookingId),
  });
}
