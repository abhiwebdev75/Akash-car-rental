import { apiClient } from '../../lib/apiClient';

/**
 * Notifications API — the authenticated user's own inbox. The backend scopes
 * every request to req.user._id, so the same endpoints serve both customers
 * and staff; the audience field on each item tells us who it was for.
 */
export const notificationsApi = {
  // List newest-first. Params: { page, limit, unreadOnly }. Returns { items, meta }.
  async list(params = {}) {
    const { data } = await apiClient.get('/notifications', { params });
    return { items: data.data, meta: data.meta };
  },

  // Lightweight badge count — polled on an interval. Returns a number.
  async unreadCount() {
    const { data } = await apiClient.get('/notifications/unread-count');
    return data.data?.count ?? 0;
  },

  // Mark a single notification read (only succeeds if it belongs to the user).
  async markRead(id) {
    const { data } = await apiClient.patch(`/notifications/${id}/read`);
    return data.data;
  },

  // Mark every unread notification read. Returns { modified }.
  async markAllRead() {
    const { data } = await apiClient.patch('/notifications/read-all');
    return data.data;
  },
};
