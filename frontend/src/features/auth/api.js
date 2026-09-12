import { apiClient } from '../../lib/apiClient';

// Auth API. Every response uses the standard envelope { success, data, ... },
// so we return `data.data`. Note the two "me" shapes differ on the backend:
// /auth/me wraps the user as { user }, while /users/me returns it directly.
export const authApi = {
  async register(payload) {
    const { data } = await apiClient.post('/auth/register', payload);
    return data.data; // { user, accessToken, refreshToken }
  },

  async login(credentials) {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data.data; // { user, accessToken, refreshToken }
  },

  async me() {
    const { data } = await apiClient.get('/auth/me');
    return data.data.user;
  },

  async refresh() {
    const { data } = await apiClient.post('/auth/refresh', {});
    return data.data; // { accessToken, ... }
  },

  async logout() {
    await apiClient.post('/auth/logout', {});
  },

  async changePassword(payload) {
    const { data } = await apiClient.post('/auth/change-password', payload);
    return data.data;
  },
};
