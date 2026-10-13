import { useQuery } from '@tanstack/react-query'

import { requireServerSuccess } from '@/lib/server-error-message'

import { getApiKeys } from '../api'

/**
 * Total and enabled key counts for the overview cards. Reads the first page of
 * the real key list; the page size is capped by the API, so the reported total
 * always comes from the server rather than the fetched page.
 */
export function useApiKeySummary() {
  const query = useQuery({
    queryKey: ['api-keys', 'summary'],
    queryFn: async () =>
      requireServerSuccess(await getApiKeys({ p: 1, size: 100 })),
    staleTime: 60 * 1000,
  })

  const items = query.data?.data?.items ?? []

  return {
    total: query.data?.data?.total ?? items.length,
    enabled: items.filter((item) => item.status === 1).length,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: () => {
      void query.refetch()
    },
  }
}
