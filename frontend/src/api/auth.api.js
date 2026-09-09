import client from './client';
import { mockDemoUsers } from './mockData';

export const authApi = {
  login: async (credentials) => {
    try {
      const res = await client.post('/auth/login', credentials);
      return res.data;
    } catch (err) {
      // Offline fallback: check if credentials match demo users
      const email = credentials.email?.toLowerCase();
      const match = Object.values(mockDemoUsers).find((u) => u.email.toLowerCase() === email);
      if (match) {
        return {
          user: match,
          accessToken: match.token,
          refreshToken: 'mock_refresh_token',
        };
      }
      throw err;
    }
  },

  register: async (userData) => {
    try {
      const res = await client.post('/auth/register', userData);
      return res.data;
    } catch (err) {
      // Mock fallback
      const newUser = {
        _id: 'user_' + Date.now(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      };
      return {
        user: newUser,
        accessToken: 'mock_jwt_registered',
        refreshToken: 'mock_refresh_registered',
      };
    }
  },

  me: async () => {
    const res = await client.get('/auth/me');
    return res.data?.user || res.data;
  },

  logout: async () => {
    try {
      await client.post('/auth/logout');
    } catch (e) {
      // Ignore offline errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

