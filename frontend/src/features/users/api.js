import { apiClient } from '../../lib/apiClient';

export const usersApi = {
  // NOTE: /users/me returns the user object directly as `data` (unlike /auth/me).
  async getMe() {
    const { data } = await apiClient.get('/users/me');
    return data.data;
  },

  // Self-service profile update. payload: { name?, phone?, address?, profilePhoto? }
  async updateProfile(payload) {
    const { data } = await apiClient.patch('/users/me', payload);
    return data.data;
  },
};
