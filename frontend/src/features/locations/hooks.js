import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from './api';

// Public active locations for the booking widget / dropdowns (customer-safe
// fields). Long-lived — rarely changes. Consumed across the customer site.
export function useLocations() {
  return useQuery({
    queryKey: ['locations', 'public'],
    queryFn: () => locationsApi.listPublic(),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Admin ────────────────────────────────────────────────────────────────

// Full location list (staffUp) with manager populated + status. Powers the
// Location management page.
export function useAdminLocations() {
  return useQuery({
    queryKey: ['locations', 'admin'],
    queryFn: () => locationsApi.list(),
    staleTime: 60 * 1000,
  });
}

export function useLocation(id) {
  return useQuery({
    queryKey: ['locations', 'detail', id],
    queryFn: () => locationsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => locationsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => locationsApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      qc.invalidateQueries({ queryKey: ['locations', 'detail', id] });
    },
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => locationsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}
