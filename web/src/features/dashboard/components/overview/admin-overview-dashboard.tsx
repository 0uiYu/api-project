import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  HeartPulse,
  Layers,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { IconBadge } from '@/components/ui/icon-badge'
import { getUserQuotaDates } from '@/features/dashboard/api'
import { calculateDashboardStats } from '@/features/dashboard/lib'
import { getPerfMetricsSummary } from '@/features/performance-metrics/api'
import { toIntlLocale } from '@/i18n/languages'
import { api } from '@/lib/api'
import { formatQuota, formatNumber } from '@/lib/format'

type ChannelStatus = { status: number }

function startOfWindow() {
  const end = Math.floor(Date.now() / 1000)
  return { start_timestamp: end - 24 * 60 * 60, end_timestamp: end }
}

export function AdminOverviewDashboard() {
  const { t, i18n } = useTranslation()
  const timeRange = startOfWindow()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)

  const quotaQuery = useQuery({
    queryKey: ['admin-overview-quota', timeRange.start_timestamp],
    queryFn: async () => {
      const response = await getUserQuotaDates(timeRange, true)
      return calculateDashboardStats(response.data ?? [])
    },
    staleTime: 60_000,
  })
  const performanceQuery = useQuery({
    queryKey: ['admin-overview-performance'],
    queryFn: async () => getPerfMetricsSummary(24),
    staleTime: 60_000,
  })
  const channelQuery = useQuery({
    queryKey: ['admin-overview-channel-status'],
    queryFn: async () => {
      const response = await api.get<{ data: ChannelStatus[] }>(
        '/api/channel-status'
      )
      return response.data.data ?? []
    },
    staleTime: 60_000,
  })
  const affiliateQuery = useQuery({
    queryKey: ['admin-overview-affiliate'],
    queryFn: async () => {
      const response = await api.get<{
        data: { stats: { users_with_inviter: number; history_quota: number } }
      }>('/api/admin/affiliate/stats')
      return response.data.data
    },
    staleTime: 60_000,
  })
  const usageQuery = useQuery({
    queryKey: ['admin-overview-usage-summary'],
    queryFn: async () => {
      const response = await api.get<{
        data: {
          requests: number
          successful_requests: number
          failed_requests: number
          input_tokens: number
          output_tokens: number
          cache_read_tokens: number
          cache_write_tokens: number
          charged_quota: number
          requests_per_minute: number
          tokens_per_minute: number
          average_latency_seconds: number
        }
      }>('/api/admin/analytics/usage-summary?hours=24')
      return response.data.data
    },
    staleTime: 60_000,
  })

  const stats = quotaQuery.data ?? {
    totalCount: 0,
    totalQuota: 0,
    totalTokens: 0,
  }
  const channels = channelQuery.data ?? []
  const unhealthyChannels = channels.filter(
    (channel) => channel.status !== 1
  ).length
  const successRate = performanceQuery.data?.data.summary?.success_rate
  const affiliateStats = affiliateQuery.data?.stats
  const usage = usageQuery.data

  const cards = [
    {
      title: t('Requests in the last 24 hours'),
      value: formatNumber(usage?.requests ?? stats.totalCount, locale),
      icon: Activity,
      tone: 'info' as const,
    },
    {
      title: t('User quota consumed'),
      value: formatQuota(usage?.charged_quota ?? stats.totalQuota),
      icon: Wallet,
      tone: 'success' as const,
    },
    {
      title: t('Tokens in the last 24 hours'),
      value: formatNumber(
        (usage?.input_tokens ?? 0) +
          (usage?.output_tokens ?? stats.totalTokens),
        locale
      ),
      icon: Layers,
      tone: 'chart-4' as const,
    },
    {
      title: t('Performance success rate'),
      value: successRate == null ? '—' : `${(successRate * 100).toFixed(2)}%`,
      icon: HeartPulse,
      tone: 'success' as const,
    },
    {
      title: t('Requests per minute'),
      value: formatNumber(usage?.requests_per_minute ?? 0, locale),
      icon: Activity,
      tone: 'info' as const,
    },
    {
      title: t('Tokens per minute'),
      value: formatNumber(usage?.tokens_per_minute ?? 0, locale),
      icon: Layers,
      tone: 'chart-4' as const,
    },
    {
      title: t('Average latency'),
      value:
        usage == null ? '—' : `${usage.average_latency_seconds.toFixed(2)}s`,
      icon: HeartPulse,
      tone: 'info' as const,
    },
    {
      title: t('Failed requests'),
      value: formatNumber(usage?.failed_requests ?? 0, locale),
      icon: AlertTriangle,
      tone: 'warning' as const,
    },
    {
      title: t('Unhealthy channels'),
      value: formatNumber(unhealthyChannels, locale),
      icon: AlertTriangle,
      tone: unhealthyChannels > 0 ? ('warning' as const) : ('success' as const),
    },
    {
      title: t('Invited users'),
      value: formatNumber(affiliateStats?.users_with_inviter ?? 0, locale),
      icon: Activity,
      tone: 'info' as const,
    },
  ]

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        {t('Operations Overview')}
      </SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <p className='text-muted-foreground text-sm'>
          {t('Operational data for the last 24 hours')}
        </p>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-6'>
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className='rounded-lg border p-4'>
                <div className='flex items-center gap-2'>
                  <IconBadge tone={card.tone} size='sm'>
                    <Icon />
                  </IconBadge>
                  <span className='text-muted-foreground text-xs'>
                    {card.title}
                  </span>
                </div>
                <div className='mt-3 font-mono text-2xl font-semibold tabular-nums'>
                  {card.value}
                </div>
              </div>
            )
          })}
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
