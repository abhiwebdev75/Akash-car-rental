import { apiClient } from '../../lib/apiClient';

export const addOnsApi = {
  // Active add-ons customers can attach to a booking. Returns an array.
  async list() {
    const { data } = await apiClient.get('/addons');
    return data.data;
  },
};
