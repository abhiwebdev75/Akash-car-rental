import { apiClient } from '../../lib/apiClient';

export const bookingsApi = {
  // Trusted price quote — no side effects. Returns { vehicleId, startAt, endAt, currency, quote }.
  async quote(payload) {
    const { data } = await apiClient.post('/bookings/quote', payload);
    return data.data;
  },

  // Create a booking (server re-checks availability + pricing inside a transaction).
  // Staff pass customerId + locationId; customers book for themselves.
  async create(payload) {
    const { data } = await apiClient.post('/bookings', payload);
    return data.data;
  },

  // Bookings list (backend scopes by role: customers see their own, staff see
  // all / their location). Returns { items, meta }.
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

  // ── Staff lifecycle transitions (staffUp) ──────────────────────────────────
  async confirm(id) {
    const { data } = await apiClient.post(`/bookings/${id}/confirm`);
    return data.data;
  },

  async activate(id) {
    const { data } = await apiClient.post(`/bookings/${id}/activate`);
    return data.data;
  },

  async complete(id) {
    const { data } = await apiClient.post(`/bookings/${id}/complete`);
    return data.data;
  },
};
