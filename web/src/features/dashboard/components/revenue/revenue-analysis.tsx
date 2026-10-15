import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { api } from '@/lib/api'
import { formatQuota, formatNumber } from '@/lib/format'
import { toIntlLocale } from '@/i18n/languages'

type UsageSummary = {
  charged_quota: number
  requests: number
  input_tokens: number
  output_tokens: number
  reference_cost_usd: number
  reference_profit_usd: number
  cost_available_requests: number
}

export function RevenueAnalysis() {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const query = useQuery({
    queryKey: ['admin-revenue-analysis'],
    queryFn: async () => {
      const response = await api.get<{ data: UsageSummary }>(
        '/api/admin/analytics/usage-summary?hours=24'
      )
      return response.data.data
    },
    staleTime: 60_000,
  })
  const data = query.data
  const totalTokens = (data?.input_tokens ?? 0) + (data?.output_tokens ?? 0)
  const cards = [
    [t('User charges'), data ? formatQuota(data.charged_quota) : '—'],
    [t('Requests'), data ? formatNumber(data.requests, locale) : '—'],
    [t('Total tokens'), data ? formatNumber(totalTokens, locale) : '—'],
    [
      t('Reference upstream cost'),
      data && data.cost_available_requests > 0
        ? `$${data.reference_cost_usd.toFixed(4)}`
        : t('Unavailable: reference price is not configured'),
    ],
    [
      t('Reference profit'),
      data && data.cost_available_requests > 0
        ? `$${data.reference_profit_usd.toFixed(4)}`
        : t('Unavailable: reference price is not configured'),
    ],
  ]
  return (
    <div className='space-y-4'>
      <p className='text-muted-foreground text-sm'>
        {t('User charges are measured from settled usage logs. They are not upstream cost or profit.')}
      </p>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
        {cards.map(([label, value]) => (
          <div key={label} className='rounded-lg border p-4'>
            <div className='text-muted-foreground text-xs'>{label}</div>
            <div className='mt-3 text-sm font-semibold tabular-nums'>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
