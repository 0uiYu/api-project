import { useTranslation } from 'react-i18next'

import { formatQuotaWithCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useSystemConfigStore } from '@/stores/system-config-store'

import type { ApiKey } from '../types'

type ApiKeyQuotaCellProps = {
  apiKey: ApiKey
  now: number
  variant?: 'table' | 'card'
}

export function ApiKeyQuotaCell(props: ApiKeyQuotaCellProps) {
  const { t } = useTranslation()
  useSystemConfigStore((state) => state.config.currency)
  const unlimited = props.apiKey.unlimited_quota
  const remaining = props.apiKey.remain_quota
  const value = unlimited
    ? t('Unlimited')
    : formatQuotaWithCurrency(remaining, { showSymbol: false })

  return (
    <span
      data-slot='api-key-quota-values'
      title={value}
      className={cn(
        'block max-w-full min-w-0 truncate text-sm font-medium',
        props.variant === 'card' && 'text-right',
        !unlimited && 'tabular-nums',
        !unlimited && remaining < 0 && 'text-destructive',
        !unlimited && remaining === 0 && 'text-muted-foreground'
      )}
    >
      {value}
    </span>
  )
}
