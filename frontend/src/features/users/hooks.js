import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from './api';
import { cleanParams } from '../../lib/query';

// Admin user directory (managerUp). Use `role` to split customers vs staff.
export function useUsers(params = {}) {
  const clean = cleanParams(params);
  return useQuery({
    queryKey: ['users', 'list', clean],
    queryFn: () => usersApi.list(clean),
    placeholderData: keepPreviousData,
  });
}

export function useUser(id) {
  return useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => usersApi.createStaff(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => usersApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users', 'detail', id] });
    },
  });
}
