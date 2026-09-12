import { apiClient } from '../../lib/apiClient';

export const reviewsApi = {
  // Public: visible reviews for a vehicle (array).
  async listForVehicle(vehicleId) {
    const { data } = await apiClient.get(`/reviews/vehicle/${vehicleId}`);
    return data.data;
  },

  // Authenticated customer reviews their own COMPLETED booking.
  // payload: { bookingId, rating (1-5), review }
  async create(payload) {
    const { data } = await apiClient.post('/reviews', payload);
    return data.data;
  },
};
