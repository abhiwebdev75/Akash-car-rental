import { apiClient } from '../../lib/apiClient';

// Auth API. Every response uses the standard envelope { success, data, ... },
// so we return `data.data`. Note the two "me" shapes differ on the backend:
// /auth/me wraps the user as { user }, while /users/me returns it directly.
export const authApi = {
  async register(payload) {
    const { data } = await apiClient.post('/auth/register', payload);
    return data.data; // { email, requiresVerification } — no tokens yet
  },

  // Confirm the signup OTP; this is the first login (returns tokens).
  async verifyEmail(payload) {
    const { data } = await apiClient.post('/auth/verify-email', payload);
    return data.data; // { user, accessToken, refreshToken }
  },

  async resendVerification(email) {
    const { data } = await apiClient.post('/auth/resend-verification', { email });
    return data;
  },

  async login(credentials) {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data.data; // { user, accessToken, refreshToken }
  },

  async forgotPassword(email) {
    const { data } = await apiClient.post('/auth/forgot-password', { email });
    return data;
  },

  async resetPassword(payload) {
    const { data } = await apiClient.post('/auth/reset-password', payload);
    return data;
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
