import axios from 'axios';
import { API_BASE_URL } from '../config/env';

/**
 * Single Axios instance for the whole app.
 *
 * Auth model: the access token lives only in memory (never localStorage — that
 * keeps it out of reach of XSS). The refresh token is an httpOnly cookie the
 * backend sets, scoped to /api/auth, so `withCredentials` lets the browser send
 * it automatically. On a 401 we transparently refresh once and retry.
 */

let accessToken = null;
let unauthorizedHandler = null;

export function setAccessToken(token) {
  accessToken = token || null;
}
export function getAccessToken() {
  return accessToken;
}
/** AuthContext registers this so a failed background refresh drops to logged-out. */
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// These endpoints ARE the auth flow — never try to refresh-and-retry them.
const AUTH_BYPASS = ['/auth/login', '/auth/register', '/auth/refresh'];

let refreshPromise = null;

/** De-dupe concurrent refreshes into one in-flight request. */
async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        const token = res?.data?.data?.accessToken || null;
        setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (!response || !config) return Promise.reject(error);

    const isBypass = AUTH_BYPASS.some((p) => (config.url || '').includes(p));
    if (response.status === 401 && !config._retried && !isBypass) {
      config._retried = true;
      try {
        const token = await refreshAccessToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
          return apiClient(config);
        }
      } catch {
        /* fall through to logout */
      }
      setAccessToken(null);
      if (unauthorizedHandler) unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);

/** Normalise an Axios error into a friendly message + optional field errors. */
export function extractApiError(error) {
  const data = error?.response?.data;
  return {
    message: data?.message || error?.message || 'Something went wrong. Please try again.',
    errors: data?.errors || null,
    status: error?.response?.status || 0,
    code: data?.code || null,
  };
}
