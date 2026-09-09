import client from './client';
import { mockBookings } from './mockData';

export const bookingsApi = {
  quote: async (quoteParams) => {
    // quoteParams: { vehicleId, pickupDate, returnDate, pickupTime, returnTime, addOns, couponCode }
    const res = await client.post('/bookings/quote', quoteParams);
    return res.data;
  },

  create: async (bookingData) => {
    const res = await client.post('/bookings', bookingData);
    return res.data;
  },

  list: async (params = {}) => {
    const res = await client.get('/bookings', { params });
    return res.data || mockBookings;
  },

  getById: async (id) => {
    const res = await client.get(`/bookings/${id}`);
    return res.data || mockBookings.find((b) => b._id === id || b.bookingNumber === id);
  },

  confirm: async (id) => {
    const res = await client.post(`/bookings/${id}/confirm`);
    return res.data;
  },

  activate: async (id) => {
    const res = await client.post(`/bookings/${id}/activate`);
    return res.data;
  },

  complete: async (id) => {
    const res = await client.post(`/bookings/${id}/complete`);
    return res.data;
  },

  cancel: async (id, reason) => {
    const res = await client.post(`/bookings/${id}/cancel`, { reason });
    return res.data;
  },

  calendar: async (params = {}) => {
    const res = await client.get('/bookings/calendar', { params });
    return res.data || [];
  },
};

