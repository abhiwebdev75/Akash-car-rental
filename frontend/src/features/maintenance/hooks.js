import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from './api';
import { cleanParams } from '../../lib/query';

export function useMaintenance(params = {}) {
  const clean = cleanParams(params);
  return useQuery({
    queryKey: ['maintenance', 'list', clean],
    queryFn: () => maintenanceApi.list(clean),
    placeholderData: keepPreviousData,
  });
}

// Maintenance can change a vehicle's status snapshot, so invalidate vehicles too.
function invalidateMaintenance(qc) {
  qc.invalidateQueries({ queryKey: ['maintenance'] });
  qc.invalidateQueries({ queryKey: ['vehicles'] });
}

export function useScheduleMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => maintenanceApi.schedule(payload),
    onSuccess: () => invalidateMaintenance(qc),
  });
}

export function useStartMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => maintenanceApi.start(id),
    onSuccess: () => invalidateMaintenance(qc),
  });
}

export function useCompleteMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => maintenanceApi.complete(id, payload),
    onSuccess: () => invalidateMaintenance(qc),
  });
}

export function useCancelMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => maintenanceApi.cancel(id),
    onSuccess: () => invalidateMaintenance(qc),
  });
}
