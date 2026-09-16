import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => bookingsApi.cancel(id, reason),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['bookings', 'detail', id] });
    },
  });
}

// ── Admin ──────────────────────────────────────────────────────────────────

// Same endpoint as useMyBookings but with a distinct cache key and admin filters
// (status, customerId, vehicleId, locationId, from, to). Backend scopes the rows.
export function useAdminBookings(params = {}) {
  const clean = cleanParams(params);
  return useQuery({
    queryKey: ['bookings', 'admin', clean],
    queryFn: () => bookingsApi.list(clean),
    placeholderData: keepPreviousData,
  });
}

// Calendar agenda — bookings intersecting [from, to]. Only runs once the range
// is present. Kept lightly cached since upcoming pickups/returns change often.
export function useCalendar(params = {}, { enabled = true } = {}) {
  const clean = cleanParams(params);
  const ready = enabled && !!clean.from && !!clean.to;
  return useQuery({
    queryKey: ['bookings', 'calendar', clean],
    queryFn: () => bookingsApi.calendar(clean),
    enabled: ready,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// Shared invalidation for lifecycle actions (each returns the updated booking).
function useBookingAction(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      const id = data?._id;
      if (id) qc.invalidateQueries({ queryKey: ['bookings', 'detail', id] });
    },
  });
}

export function useConfirmBooking() {
  return useBookingAction((id) => bookingsApi.confirm(id));
}

export function useActivateBooking() {
  return useBookingAction((id) => bookingsApi.activate(id));
}

export function useCompleteBooking() {
  return useBookingAction((id) => bookingsApi.complete(id));
}
