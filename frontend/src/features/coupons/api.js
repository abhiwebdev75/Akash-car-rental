import { apiClient } from '../../lib/apiClient';

// Coupon administration (managerUp). Validation/application of codes happens
// server-side in the pricing engine; these endpoints only manage the records.
export const couponsApi = {
  async list() {
    const { data } = await apiClient.get('/coupons');
    return data.data; // array, newest first
  },

  async getById(id) {
    const { data } = await apiClient.get(`/coupons/${id}`);
    return data.data;
  },

  async create(payload) {
    const { data } = await apiClient.post('/coupons', payload);
    return data.data;
  },

  async update(id, payload) {
    const { data } = await apiClient.patch(`/coupons/${id}`, payload);
    return data.data;
  },

  async remove(id) {
    const { data } = await apiClient.delete(`/coupons/${id}`);
    return data.data;
  },
};
