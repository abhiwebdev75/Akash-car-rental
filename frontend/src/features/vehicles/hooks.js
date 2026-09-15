import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

// ── Admin ──────────────────────────────────────────────────────────────────

export function useAdminVehicles(params = {}) {
  const clean = cleanParams(params);
  return useQuery({
    queryKey: ['vehicles', 'admin', clean],
    queryFn: () => vehiclesApi.adminList(clean),
    placeholderData: keepPreviousData,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => vehiclesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => vehiclesApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['vehicles', 'detail', id] });
    },
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => vehiclesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}

export function useUploadVehicleImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, files }) => vehiclesApi.uploadImages(id, files),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['vehicles', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['vehicles', 'admin'] });
    },
  });
}

export function useDeleteVehicleImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, publicId }) => vehiclesApi.deleteImage(id, publicId),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['vehicles', 'detail', id] });
    },
  });
}
