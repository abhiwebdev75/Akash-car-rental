import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from './api';

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.getMe,
    enabled,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => usersApi.updateProfile(payload),
    onSuccess: (user) => {
      qc.setQueryData(['users', 'me'], user);
    },
  });
}
