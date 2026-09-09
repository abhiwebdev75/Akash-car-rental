import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth.api';
import { mockDemoUsers } from '../api/mockData';
import { ROLES, STAFF_ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current token
    const token = localStorage.getItem('token');
    if (token && !user) {
      authApi.me()
        .then((userData) => {
          if (userData) {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    if (data && data.user) {
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
      }
      return data.user;
    }
    throw new Error('Invalid login response');
  };

  const register = async (userData) => {
    const data = await authApi.register(userData);
    if (data && data.user) {
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
      }
      return data.user;
    }
    throw new Error('Registration failed');
  };

  const demoLogin = (roleKey) => {
    const demoUser = mockDemoUsers[roleKey.toLowerCase()];
    if (demoUser) {
      setUser(demoUser);
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.setItem('token', demoUser.token);
      return demoUser;
    }
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const role = user?.role || null;
  const isAuthenticated = Boolean(user);
  const isOwner = role === ROLES.OWNER;
  const isManager = role === ROLES.MANAGER || isOwner;
  const isStaff = STAFF_ROLES.includes(role);
  const isAccountant = role === ROLES.ACCOUNTANT || isOwner;
  const isCustomer = role === ROLES.CUSTOMER;
  const canAccessAdmin = isStaff;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        isAuthenticated,
        isOwner,
        isManager,
        isStaff,
        isAccountant,
        isCustomer,
        canAccessAdmin,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

