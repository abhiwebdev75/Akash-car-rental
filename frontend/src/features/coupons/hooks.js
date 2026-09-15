import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { couponsApi } from './api';

export function useCoupons() {
  return useQuery({ queryKey: ['coupons', 'list'], queryFn: couponsApi.list });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => couponsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => couponsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => couponsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}
