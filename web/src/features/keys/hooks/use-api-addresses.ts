import { useTranslation } from 'react-i18next'

import { useApiInfo } from '@/features/dashboard/hooks/use-status-data'
import { useStatus } from '@/hooks/use-status'

export interface ApiAddress {
  url: string
  route: string
  description: string
}

/**
 * API addresses from the server status: the configured `api_info` list when the
 * operator published one, otherwise the server address of this instance. Never
 * a placeholder host.
 */
export function useApiAddresses(): {
  addresses: ApiAddress[]
  loading: boolean
} {
  const { t } = useTranslation()
  const { status, loading } = useStatus()
  const { items } = useApiInfo()
  const serverAddress =
    (typeof status?.server_address === 'string' &&
      status.server_address.trim()) ||
    ''
  const addresses = items.length
    ? items
    : [
        {
          url: serverAddress || window.location.origin,
          route: serverAddress ? t('Default API address') : t('Current domain'),
          description: '',
        },
      ]

  return { addresses, loading }
}
