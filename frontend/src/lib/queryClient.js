import { QueryClient } from '@tanstack/react-query';

// Shared TanStack Query client. Booking data changes with real-world state
// (availability, statuses), so we keep a short stale window and avoid noisy
// window-focus refetches that could surprise users mid-checkout.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});
