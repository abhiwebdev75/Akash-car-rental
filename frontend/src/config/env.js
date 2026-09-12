// Runtime configuration read from Vite env vars (only VITE_-prefixed vars are exposed).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// A short, human-friendly build/runtime flag.
export const IS_DEV = import.meta.env.DEV;
