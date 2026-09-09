import client from './client';
import { mockVehicles } from './mockData';

export const vehiclesApi = {
  browse: async (params = {}) => {
    const res = await client.get('/vehicles', { params });
    return res.data || [];
  },

  checkAvailability: async (params = {}) => {
    // params: locationId, start, end, type, transmission, seats...
    const res = await client.get('/vehicles/availability', { params });
    return res.data || [];
  },

  getById: async (id) => {
    const res = await client.get(`/vehicles/${id}`);
    return res.data || mockVehicles.find((v) => v._id === id);
  },

  adminList: async (params = {}) => {
    const res = await client.get('/vehicles/admin', { params });
    return res.data || mockVehicles;
  },

  create: async (data) => {
    const res = await client.post('/vehicles', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await client.patch(`/vehicles/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await client.delete(`/vehicles/${id}`);
    return res.data;
  },
};

