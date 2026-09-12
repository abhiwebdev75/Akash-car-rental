import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../features/auth/api';
import { setAccessToken, setUnauthorizedHandler } from '../lib/apiClient';
import { queryClient } from '../lib/queryClient';
import { ROLES, STAFF_ROLES } from '../lib/constants';

/**
 * Authentication state for the whole app.
 *
 * On mount we try to restore a session from the httpOnly refresh cookie, so a
 * page reload keeps the user signed in without ever persisting a token in JS.
 * `status` is 'loading' until that bootstrap resolves.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | unauthenticated

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('unauthenticated');
    queryClient.clear();
  }, []);

  // Bootstrap the session using the refresh cookie.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { accessToken } = await authApi.refresh();
        if (!accessToken) throw new Error('no session');
        setAccessToken(accessToken);
        const me = await authApi.me();
        if (!active) return;
        setUser(me);
        setStatus('authenticated');
      } catch {
        if (!active) return;
        setAccessToken(null);
        setUser(null);
        setStatus('unauthenticated');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // If a background refresh fails (cookie expired/revoked), drop to logged-out.
  useEffect(() => {
    setUnauthorizedHandler(() => clearAuth());
    return () => setUnauthorizedHandler(null);
  }, [clearAuth]);

  const login = useCallback(async (credentials) => {
    const { user: u, accessToken } = await authApi.login(credentials);
    setAccessToken(accessToken);
    setUser(u);
    setStatus('authenticated');
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: u, accessToken } = await authApi.register(payload);
    setAccessToken(accessToken);
    setUser(u);
    setStatus('authenticated');
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore network errors — we clear locally regardless */
    }
    clearAuth();
  }, [clearAuth]);

  const refreshUser = useCallback(async () => {
    const me = await authApi.me();
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      isStaff: !!user && STAFF_ROLES.includes(user.role),
      isCustomer: user?.role === ROLES.CUSTOMER,
      hasRole: (...roles) => !!user && roles.includes(user.role),
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [user, status, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
