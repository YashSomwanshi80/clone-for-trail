import { QueryClient } from '@tanstack/react-query'

/**
 * Shared QueryClient instance.
 * All useQuery/useMutation calls across the app share this cache —
 * a single camerasApi.list() fetch is reused by Dashboard, UploadPage,
 * and Sidebar rather than each issuing an independent request.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't immediately refetch on window focus during a demo/review session
      refetchOnWindowFocus: false,
      // Stale time: treat camera list as fresh for 60s before background refetch
      staleTime: 60_000,
      // Keep data in cache for 5 minutes after last subscriber unmounts
      gcTime: 5 * 60_000,
      // Retry once on failure before showing error state
      retry: 1,
    },
  },
})
