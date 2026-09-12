import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { vehiclesApi } from './api';
import { cleanParams } from '../../lib/query';

export function useVehicles(params = {}, { enabled = true } = {}) {
  const clean = cleanParams(params);
  return useQuery({
    queryKey: ['vehicles', 'browse', clean],
    queryFn: () => vehiclesApi.browse(clean),
    enabled,
    placeholderData: keepPreviousData, // smooth page/filter transitions
  });
}

export function useVehicle(id) {
  return useQuery({
    queryKey: ['vehicles', 'detail', id],
    queryFn: () => vehiclesApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Availability search. Only runs when enabled AND the required range is present,
 * so we never fire an invalid request. Availability is time-sensitive, so it is
 * not cached long.
 */
export function useAvailability(params = {}, { enabled = true } = {}) {
  const clean = cleanParams(params);
  const ready = enabled && !!clean.start && !!clean.end;
  return useQuery({
    queryKey: ['vehicles', 'availability', clean],
    queryFn: () => vehiclesApi.availability(clean),
    enabled: ready,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}
