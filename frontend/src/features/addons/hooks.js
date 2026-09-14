import { useQuery } from '@tanstack/react-query';
import { addOnsApi } from './api';

// Add-on catalog changes rarely; the endpoint needs auth, so this only runs
// inside the (login-gated) booking flow.
export function useAddOns(enabled = true) {
  return useQuery({
    queryKey: ['addons', 'active'],
    queryFn: addOnsApi.list,
    enabled,
    staleTime: 5 * 60_000,
  });
}
