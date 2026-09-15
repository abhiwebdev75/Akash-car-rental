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

  // ── Admin (managerUp) ──────────────────────────────────────────────────────

  // User directory (paginated). Filter with { role, status, q, page, limit, sort }.
  // Pass role=CUSTOMER for the customer list, or a staff role for the team list.
  // Returns { items, meta:{page,limit,total,totalPages} }.
  async list(params = {}) {
    const { data } = await apiClient.get('/users', { params });
    return { items: data.data, meta: data.meta };
  },

  async getById(id) {
    const { data } = await apiClient.get(`/users/${id}`);
    return data.data;
  },

  // Create a staff member (OWNER only). Customers self-register elsewhere.
  // payload: { name, email, phone?, password, role, assignedLocation? }
  async createStaff(payload) {
    const { data } = await apiClient.post('/users', payload);
    return data.data;
  },

  // Update a user (OWNER only). payload: { name?, phone?, role?, status?, assignedLocation? }
  async update(id, payload) {
    const { data } = await apiClient.patch(`/users/${id}`, payload);
    return data.data;
  },
};
