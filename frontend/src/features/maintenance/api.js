import { apiClient } from '../../lib/apiClient';

// Vehicle maintenance windows (staffUp). Scheduling that collides with a
// blocking booking is rejected by the backend.
export const maintenanceApi = {
  // Array, newest scheduled first. vehicleId is populated (brand/model/registrationNumber).
  async list(params = {}) {
    const { data } = await apiClient.get('/maintenance', { params });
    return data.data;
  },

  // payload: { vehicleId, type, description?, scheduledStart, scheduledEnd, vendor?, cost?, notes? }
  async schedule(payload) {
    const { data } = await apiClient.post('/maintenance', payload);
    return data.data;
  },

  async start(id) {
    const { data } = await apiClient.post(`/maintenance/${id}/start`);
    return data.data;
  },

  // payload: { cost?, odometerAtService?, notes? }
  async complete(id, payload = {}) {
    const { data } = await apiClient.post(`/maintenance/${id}/complete`, payload);
    return data.data;
  },

  async cancel(id) {
    const { data } = await apiClient.post(`/maintenance/${id}/cancel`);
    return data.data;
  },
};
