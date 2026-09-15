import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { reportsApi } from './api';
import { cleanParams } from '../../lib/query';

export function useRevenueReport(params = {}) {
  const clean = cleanParams(params);
  return useQuery({
    queryKey: ['reports', 'revenue', clean],
    queryFn: () => reportsApi.revenue(clean),
    placeholderData: keepPreviousData,
  });
}

export function useBookingsReport(params = {}) {
  const clean = cleanParams(params);
  return useQuery({
    queryKey: ['reports', 'bookings', clean],
    queryFn: () => reportsApi.bookings(clean),
    placeholderData: keepPreviousData,
  });
}

export function useUtilizationReport(params = {}) {
  const clean = cleanParams(params);
  return useQuery({
    queryKey: ['reports', 'utilization', clean],
    queryFn: () => reportsApi.utilization(clean),
    placeholderData: keepPreviousData,
  });
}

export function useOutstandingReport(params = {}) {
  const clean = cleanParams(params);
  return useQuery({
    queryKey: ['reports', 'outstanding', clean],
    queryFn: () => reportsApi.outstanding(clean),
    placeholderData: keepPreviousData,
  });
}
