import axios from 'axios';
import * as mockData from './mockData';

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT access token to every request if available
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap response or gracefully provide mock fallback if backend is offline
client.interceptors.response.use(
  (response) => {
    // Backend standard envelope: { success: true, data: ..., meta: ... }
    if (response.data && response.data.success !== undefined) {
      return response.data;
    }
    return response.data;
  },
  async (error) => {
    // If backend is unreachable (ECONNREFUSED / Network Error / 404 / 500 when offline)
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK';
    const config = error.config || {};

    if (isNetworkError) {
      console.warn(`[DriveEasy API] Backend unavailable (${config.url}). Using mock data fallback.`);
      const fallback = getMockFallback(config);
      if (fallback) {
        return Promise.resolve({ success: true, data: fallback });
      }
    }

    // Pass along standard error message
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

function getMockFallback(config) {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();

  if (url.includes('/locations')) {
    return mockData.mockLocations;
  }
  if (url.includes('/vehicles/availability') || url.includes('/vehicles')) {
    if (url.includes('/vehicles/') && url.split('/').length > 2 && !url.includes('availability')) {
      const id = url.split('/vehicles/')[1]?.split('?')[0];
      return mockData.mockVehicles.find((v) => v._id === id) || mockData.mockVehicles[0];
    }
    return mockData.mockVehicles;
  }
  if (url.includes('/add-ons')) {
    return mockData.mockAddOns;
  }
  if (url.includes('/coupons/check') || url.includes('/coupons')) {
    return mockData.mockCoupons;
  }
  if (url.includes('/bookings/quote')) {
    return {
      days: 3,
      baseStrategy: 'DAILY',
      base: 7200,
      addOnsTotal: 400,
      subtotal: 7600,
      discount: 760,
      tax: 1231,
      taxRate: 0.18,
      securityDeposit: 5000,
      total: 8071,
      addOns: [],
    };
  }
  if (url.includes('/bookings')) {
    return mockData.mockBookings;
  }
  if (url.includes('/reports/dashboard') || url.includes('/reports')) {
    return mockData.mockDashboardStats;
  }
  if (url.includes('/reviews')) {
    return mockData.mockCustomerReviews;
  }
  if (url.includes('/maintenance')) {
    return mockData.mockMaintenanceAlerts;
  }
  if (url.includes('/settings/public')) {
    return {
      businessName: 'DriveEasy Car Rentals',
      phone: '+91 98200 10000',
      email: 'hello@driveeasy.example',
      whatsapp: '+91 98200 10000',
      currency: 'INR',
      taxRate: 0.18,
    };
  }
  return null;
}

export default client;

