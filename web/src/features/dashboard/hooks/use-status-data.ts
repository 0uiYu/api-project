import { useStatus } from '@/hooks/use-status'

import type { ApiInfoItem } from '../types'

/**
 * Get specific list from status data
 */
export function useStatusData<T = unknown>(
  enabledKey: string,
  dataKey: string
): { items: T[]; loading: boolean } {
  const { status, loading } = useStatus()
  const enabled = status ? status[enabledKey] !== false : false
  const items = (enabled ? status?.[dataKey] || [] : []) as T[]

  return { items, loading }
}

/**
 * Get API info list
 */
export function useApiInfo() {
  return useStatusData<ApiInfoItem>('api_info_enabled', 'api_info')
}
