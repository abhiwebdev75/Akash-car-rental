import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { notificationsApi } from './api';
import { cleanParams } from '../../lib/query';
import { useAuth } from '../../context/AuthContext';

const KEY = ['notifications'];

// How often to re-check the unread badge. Polling keeps the bell fresh without
// a websocket; 30s is a good balance of responsiveness vs. request volume.
const POLL_MS = 30_000;

/**
 * Unread badge count. Polls on an interval while the user is authenticated and
 * the tab is focused. Disabled entirely for signed-out visitors so we never
 * fire a 401.
 */
export function useUnreadCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...KEY, 'unread-count'],
    queryFn: () => notificationsApi.unreadCount(),
    enabled: isAuthenticated,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });
}

/**
 * The inbox list. Kept lazy — pass `enabled` so we only fetch once the dropdown
 * opens rather than on every page render.
 */
export function useNotifications(params = {}, { enabled = true } = {}) {
  const { isAuthenticated } = useAuth();
  const clean = cleanParams(params);
  return useQuery({
    queryKey: [...KEY, 'list', clean],
    queryFn: () => notificationsApi.list(clean),
    enabled: enabled && isAuthenticated,
    placeholderData: keepPreviousData,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
