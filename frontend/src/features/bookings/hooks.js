import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from './api';
import { cleanParams } from '../../lib/query';

export function useMyBookings(params = {}) {
  const clean = cleanParams(params);
  return useQuery({
    queryKey: ['bookings', 'mine', clean],
    queryFn: () => bookingsApi.list(clean),
  });
}

export function useBooking(id) {
  return useQuery({
    queryKey: ['bookings', 'detail', id],
    queryFn: () => bookingsApi.getById(id),
    enabled: !!id,
  });
}

// Quote is a mutation (POST, on demand) rather than a query — the user drives it
// by picking dates/add-ons, and we don't want it firing on render.
export function useQuoteBooking() {
  return useMutation({ mutationFn: (payload) => bookingsApi.quote(payload) });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => bookingsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings', 'mine'] }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => bookingsApi.cancel(id, reason),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['bookings', 'mine'] });
      qc.invalidateQueries({ queryKey: ['bookings', 'detail', id] });
    },
  });
}
