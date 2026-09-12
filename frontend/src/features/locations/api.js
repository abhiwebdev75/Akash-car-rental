import { apiClient } from '../../lib/apiClient';

export const locationsApi = {
  // Active locations for the booking widget (customer-safe fields only).
  async listPublic() {
    const { data } = await apiClient.get('/locations/public');
    return data.data;
  },
};
