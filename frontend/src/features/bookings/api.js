import { apiClient } from '../../lib/apiClient';

export const bookingsApi = {
  // Trusted price quote — no side effects. Returns { vehicleId, startAt, endAt, currency, quote }.
  async quote(payload) {
    const { data } = await apiClient.post('/bookings/quote', payload);
    return data.data;
  },

  // Create a booking (server re-checks availability + pricing inside a transaction).
  async create(payload) {
    const { data } = await apiClient.post('/bookings', payload);
    return data.data;
  },

  // The signed-in customer's bookings (backend scopes to the caller). Returns { items, meta }.
  async list(params = {}) {
    const { data } = await apiClient.get('/bookings', { params });
    return { items: data.data, meta: data.meta };
  },

  async getById(id) {
    const { data } = await apiClient.get(`/bookings/${id}`);
    return data.data;
  },

  async cancel(id, reason) {
    const { data } = await apiClient.post(`/bookings/${id}/cancel`, { reason });
    return data.data;
  },
};
