import { apiClient } from '../../lib/apiClient';

export const settingsApi = {
  // Public business info/branding for the storefront (name, logo, contact, currency,
  // taxRate, policies). No hardcoded business data lives in the frontend.
  async getPublic() {
    const { data } = await apiClient.get('/settings/public');
    return data.data;
  },
};
