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
  // Also serves the admin edit form (returns the vehicle regardless of status).
  async getById(id) {
    const { data } = await apiClient.get(`/vehicles/${id}`);
    return data.data;
  },

  // ── Admin (managerUp) ──────────────────────────────────────────────────────

  // Full fleet listing incl. non-bookable vehicles. Returns { items, meta }.
  async adminList(params = {}) {
    const { data } = await apiClient.get('/vehicles/admin', { params });
    return { items: data.data, meta: data.meta };
  },

  async create(payload) {
    const { data } = await apiClient.post('/vehicles', payload);
    return data.data;
  },

  async update(id, payload) {
    const { data } = await apiClient.patch(`/vehicles/${id}`, payload);
    return data.data;
  },

  // Soft-delete: backend sets status to INACTIVE.
  async remove(id) {
    const { data } = await apiClient.delete(`/vehicles/${id}`);
    return data.data;
  },

  // Multipart upload; field name is `images` (max 10). Returns the image array.
  async uploadImages(id, files) {
    const form = new FormData();
    Array.from(files).forEach((file) => form.append('images', file));
    const { data } = await apiClient.post(`/vehicles/${id}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async deleteImage(id, publicId) {
    const { data } = await apiClient.delete(`/vehicles/${id}/images`, { data: { publicId } });
    return data.data;
  },
};
