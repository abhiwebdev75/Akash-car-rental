import { apiClient } from '../../lib/apiClient';

export const settingsApi = {
  // Public business info/branding for the storefront (name, logo, contact, currency,
  // taxRate, policies). No hardcoded business data lives in the frontend.
  async getPublic() {
    const { data } = await apiClient.get('/settings/public');
    return data.data;
  },

  // ── Admin ────────────────────────────────────────────────────────────────

  // Full settings singleton (managerUp): businessName, logo, phone, email,
  // whatsapp, address, currency, taxRate, policies, booking, charges.
  async getFull() {
    const { data } = await apiClient.get('/settings');
    return data.data;
  },

  // Patch settings (OWNER only). Send only the fields being changed.
  async update(payload) {
    const { data } = await apiClient.patch('/settings', payload);
    return data.data;
  },
};
