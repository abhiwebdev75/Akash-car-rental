import { apiClient } from '../../lib/apiClient';

export const locationsApi = {
  // Active locations for the booking widget (customer-safe fields only).
  async listPublic() {
    const { data } = await apiClient.get('/locations/public');
    return data.data;
  },

  // ── Admin ────────────────────────────────────────────────────────────────

  // Full location list (staffUp), manager populated. Returns an array.
  async list() {
    const { data } = await apiClient.get('/locations');
    return data.data;
  },

  async getById(id) {
    const { data } = await apiClient.get(`/locations/${id}`);
    return data.data;
  },

  // managerUp. payload: { name, code, address, city, state, pincode, phone, manager?, status?, geo? }
  async create(payload) {
    const { data } = await apiClient.post('/locations', payload);
    return data.data;
  },

  async update(id, payload) {
    const { data } = await apiClient.patch(`/locations/${id}`, payload);
    return data.data;
  },

  // Backend returns 409 if vehicles are still assigned to the location.
  async remove(id) {
    const { data } = await apiClient.delete(`/locations/${id}`);
    return data.data;
  },
};
