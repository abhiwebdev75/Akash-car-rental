import client from './client';
import * as mockData from './mockData';

export const locationsApi = {
  list: async () => {
    const res = await client.get('/locations');
    return res.data || mockData.mockLocations;
  },
  getById: async (id) => {
    const res = await client.get(`/locations/${id}`);
    return res.data || mockData.mockLocations.find((l) => l._id === id);
  },
  create: async (data) => {
    const res = await client.post('/locations', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await client.patch(`/locations/${id}`, data);
    return res.data;
  },
};

export const addonsApi = {
  list: async () => {
    const res = await client.get('/add-ons');
    return res.data || mockData.mockAddOns;
  },
  create: async (data) => {
    const res = await client.post('/add-ons', data);
    return res.data;
  },
};

export const couponsApi = {
  list: async () => {
    const res = await client.get('/coupons');
    return res.data || mockData.mockCoupons;
  },
  check: async (code, subtotal) => {
    try {
      const res = await client.post('/coupons/check', { code, subtotal });
      return res.data;
    } catch (err) {
      // Mock fallback validation
      const match = mockData.mockCoupons.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.active);
      if (match) {
        let discount = 0;
        if (match.type === 'PERCENTAGE') {
          discount = Math.min((subtotal * match.value) / 100, match.maximumDiscount || Infinity);
        } else {
          discount = Math.min(match.value, subtotal);
        }
        return { valid: true, coupon: match, discount };
      }
      throw new Error('Invalid or expired promo code');
    }
  },
  create: async (data) => {
    const res = await client.post('/coupons', data);
    return res.data;
  },
};

export const paymentsApi = {
  list: async (params) => {
    const res = await client.get('/payments', { params });
    return res.data || [];
  },
  record: async (paymentData) => {
    const res = await client.post('/payments', paymentData);
    return res.data;
  },
  refund: async (paymentId, refundData) => {
    const res = await client.post(`/payments/${paymentId}/refund`, refundData);
    return res.data;
  },
};

export const inspectionsApi = {
  createPickup: async (data) => {
    const res = await client.post('/inspections/pickup', data);
    return res.data;
  },
  createReturn: async (data) => {
    const res = await client.post('/inspections/return', data);
    return res.data;
  },
  getByBooking: async (bookingId) => {
    const res = await client.get(`/inspections/booking/${bookingId}`);
    return res.data;
  },
};

export const reportsApi = {
  dashboard: async () => {
    const res = await client.get('/reports/dashboard');
    return res.data || mockData.mockDashboardStats;
  },
  revenue: async (params) => {
    const res = await client.get('/reports/revenue', { params });
    return res.data || [];
  },
  utilization: async (params) => {
    const res = await client.get('/reports/utilization', { params });
    return res.data || [];
  },
};

export const emergenciesApi = {
  create: async (data) => {
    const res = await client.post('/emergencies', data);
    return res.data;
  },
  list: async () => {
    const res = await client.get('/emergencies');
    return res.data || [];
  },
  updateStatus: async (id, status) => {
    const res = await client.patch(`/emergencies/${id}/status`, { status });
    return res.data;
  },
};

export const reviewsApi = {
  list: async (params) => {
    const res = await client.get('/reviews', { params });
    return res.data || mockData.mockCustomerReviews;
  },
  create: async (data) => {
    const res = await client.post('/reviews', data);
    return res.data;
  },
};

export const settingsApi = {
  getPublic: async () => {
    const res = await client.get('/settings/public');
    return res.data;
  },
  getAdmin: async () => {
    const res = await client.get('/settings');
    return res.data;
  },
  update: async (data) => {
    const res = await client.patch('/settings', data);
    return res.data;
  },
};

