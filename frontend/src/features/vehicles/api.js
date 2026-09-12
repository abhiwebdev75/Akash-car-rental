import { apiClient } from '../../lib/apiClient';

export const vehiclesApi = {
  // Public catalog browse (paginated). Returns { items, meta:{page,limit,total,totalPages} }.
  async browse(params = {}) {
    const { data } = await apiClient.get('/vehicles', { params });
    return { items: data.data, meta: data.meta };
  },

  // Availability search for a date range at a location. Returns { items, meta:{start,end,count} }.
  async availability(params = {}) {
    const { data } = await apiClient.get('/vehicles/availability', { params });
    return { items: data.data, meta: data.meta };
  },

  // Public vehicle detail, enriched with { rating, reviews } by the backend.
  async getById(id) {
    const { data } = await apiClient.get(`/vehicles/${id}`);
    return data.data;
  },
};
