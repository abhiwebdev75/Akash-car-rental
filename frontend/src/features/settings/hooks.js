import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from './api';

// Business settings rarely change within a session — cache them generously.
export function useSettings() {
  return useQuery({
    queryKey: ['settings', 'public'],
    queryFn: settingsApi.getPublic,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });
}

// ── Admin ────────────────────────────────────────────────────────────────

// Full settings singleton (managerUp) for the Business settings page.
export function useFullSettings() {
  return useQuery({
    queryKey: ['settings', 'full'],
    queryFn: settingsApi.getFull,
    staleTime: 60_000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => settingsApi.update(payload),
    onSuccess: () => {
      // A settings change (branding, tax, policies) affects both the admin
      // view and the public storefront.
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
