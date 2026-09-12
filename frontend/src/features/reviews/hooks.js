import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from './api';

export function useVehicleReviews(vehicleId) {
  return useQuery({
    queryKey: ['reviews', 'vehicle', vehicleId],
    queryFn: () => reviewsApi.listForVehicle(vehicleId),
    enabled: !!vehicleId,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => reviewsApi.create(payload),
    onSuccess: () => {
      // The vehicle detail embeds its rating + reviews, so refresh both.
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['vehicles', 'detail'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
