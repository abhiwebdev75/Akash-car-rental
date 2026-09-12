import { useQuery } from '@tanstack/react-query';
import { locationsApi } from './api';

export function useLocations() {
  return useQuery({
    queryKey: ['locations', 'public'],
    queryFn: locationsApi.listPublic,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });
}
