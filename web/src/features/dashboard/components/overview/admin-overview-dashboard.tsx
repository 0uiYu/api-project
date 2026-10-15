import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Activity,
  AlertTriangle,
  Maximize2,
  Minimize2,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { IconBadge, type IconBadgeTone } from '@/components/ui/icon-badge'
import {
  OperationsAuxiliaryPanels,
  TaskHealthPanel,
} from '@/features/dashboard/components/overview/operations-auxiliary-panels'
import { getPerfMetricsSummary } from '@/features/performance-metrics/api'
import { toIntlLocale } from '@/i18n/languages'
import { api } from '@/lib/api'
import { formatNumber, formatQuota } from '@/lib/format'

type Usage = {
  total_user_quota?: number
  total_users?: number
  users_with_balance?: number
  top_up_amount?: number
  today_top_up_amount?: number
  requests: number
  successful_requests: number
  failed_requests: number
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_write_tokens: number
  charged_quota: number
  average_latency_seconds: number
  reference_cost_usd: number
  reference_profit_usd: number
  cost_available_requests: number
}

type Operations = {
  models: Array<{ model_name: string; quota: number }>
  channels: Array<{
    channel_name: string
    requests: number
    failed_requests: number
    success_rate: number
    average_latency_seconds: number
  }>
  statuses: Array<{ status: string; count: number }>
  redemptions: { total: number; enabled: number; used: number }
  tasks: {
    total: number
    running: number
    succeeded: number
    failed: number
    stuck: number
  }
}

type Trend = {
  timestamp: number
  requests: number
  top_up_amount: number
  reference_profit_usd: number
}

const RANGES = [1, 6, 24, 72, 168]

const EMPTY_TASK_USAGE = {
  total: 0,
  running: 0,
  succeeded: 0,
  failed: 0,
  stuck: 0,
}

const FINANCE_CARD_COLORS: Record<string, string> = {
  gold: 'border-amber-500/40 bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-background',
  green:
    'border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-background',
  blue: 'border-sky-500/30 bg-gradient-to-br from-sky-500/15 to-background',
}

/** Intraday ranges stay in hours; longer ranges read better in days. */
function rangeLabel(hours: number) {
  return hours < 24 ? `${hours}h` : `${hours / 24}d`
}

function money(value: number | undefined, digits = 2) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return `$${value.toFixed(digits)}`
}

export function AdminOverviewDashboard() {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const [hours, setHours] = useState(24)
  const [fullscreen, setFullscreen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const usageQuery = useQuery({
    queryKey: ['admin-operations-usage', hours],
    queryFn: async () =>
      (
        await api.get<{ data: Usage }>(
          `/api/admin/analytics/usage-summary?hours=${hours}`
        )
      ).data.data,
    staleTime: 60000,
  })
  const operationsQuery = useQuery({
    queryKey: ['admin-operations-overview', hours],
    queryFn: async () =>
      (
        await api.get<{ data: Operations }>(
          `/api/admin/analytics/operations-overview?hours=${hours}`
        )
      ).data.data,
    staleTime: 60000,
    retry: false,
    meta: { errorToast: false },
  })
  const trendQuery = useQuery({
    queryKey: ['admin-operations-trend', hours],
    queryFn: async () =>
      (
        await api.get<{ data: Trend[] }>(
          `/api/admin/analytics/operations-trend?hours=${hours}`
        )
      ).data.data,
    staleTime: 60000,
    retry: false,
    meta: { errorToast: false },
  })
  const performanceQuery = useQuery({
    queryKey: ['admin-operations-performance', hours],
    queryFn: () => getPerfMetricsSummary(hours),
    staleTime: 60000,
  })
  const channelQuery = useQuery({
    queryKey: ['admin-operations-channels'],
    queryFn: async () =>
      (
        await api.get<{
          data: Array<{ id: number; name: string; status: number }>
        }>('/api/channel-status')
      ).data.data ?? [],
    staleTime: 60000,
  })

  const usage = usageQuery.data
  const operations = operationsQuery.data
  const channels = channelQuery.data ?? []
  const unhealthy = channels.filter((item) => item.status !== 1).length
  const ranking =
    operations?.models?.map(
      (item) => [item.model_name, item.quota] as [string, number]
    ) ?? []

  // Settled log totals win; the sampled performance summary only fills in
  // while the log aggregate is unavailable.
  let successRate = '—'
  if (usage) {
    const rate = (
      (usage.successful_requests / Math.max(usage.requests, 1)) *
      100
    ).toFixed(2)
    successRate = `${rate}%`
  } else {
    const sampled = performanceQuery.data?.data.summary?.success_rate
    if (typeof sampled === 'number') {
      successRate = `${(sampled * 100).toFixed(2)}%`
    }
  }

  const metrics: Array<{
    label: string
    value: string
    icon: LucideIcon
    tone: IconBadgeTone
  }> = [
    {
      label: t('Requests'),
      value: usage ? formatNumber(usage.requests, locale) : '—',
      icon: Activity,
      tone: 'info',
    },
    {
      label: t('Success rate'),
      value: successRate,
      icon: Activity,
      tone: 'success',
    },
    {
      label: t('Average latency'),
      value: usage ? `${usage.average_latency_seconds.toFixed(2)}s` : '—',
      icon: Activity,
      tone: 'warning',
    },
    {
      label: t('Input tokens'),
      value: usage ? formatNumber(usage.input_tokens, locale) : '—',
      icon: Activity,
      tone: 'chart-4',
    },
    {
      label: t('Output tokens'),
      value: usage ? formatNumber(usage.output_tokens, locale) : '—',
      icon: Activity,
      tone: 'chart-4',
    },
    {
      label: t('Failed requests'),
      value: usage ? formatNumber(usage.failed_requests, locale) : '—',
      icon: AlertTriangle,
      tone: 'warning',
    },
  ]

  const billingTotal = usage
    ? usage.reference_profit_usd + usage.reference_cost_usd
    : 0
  const profitMargin =
    usage && billingTotal > 0
      ? `${((usage.reference_profit_usd / billingTotal) * 100).toFixed(1)}%`
      : '—'

  const recentTrend = (trendQuery.data ?? []).slice(-4)

  const refresh = () =>
    void Promise.all([
      usageQuery.refetch(),
      operationsQuery.refetch(),
      trendQuery.refetch(),
      performanceQuery.refetch(),
      channelQuery.refetch(),
    ])

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await rootRef.current?.requestFullscreen()
    }
    setFullscreen(Boolean(document.fullscreenElement))
  }

  return (
    <div
      ref={rootRef}
      className={
        fullscreen ? 'bg-background min-h-screen overflow-auto p-4 sm:p-6' : ''
      }
    >
      <SectionPageLayout>
        <SectionPageLayout.Title>
          {t('Operations Overview')}
        </SectionPageLayout.Title>
        <SectionPageLayout.Content>
          <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
            <div>
              <div className='text-muted-foreground text-xs tracking-[.16em] uppercase'>
                Stable API / Control Center
              </div>
              <div className='text-muted-foreground mt-1 text-sm'>
                {t('Operational data for the selected time range')}
              </div>
            </div>
            <div className='flex gap-2'>
              <select
                aria-label={t('Time range')}
                value={hours}
                onChange={(event) => setHours(Number(event.target.value))}
                className='bg-background h-9 rounded-lg border px-3 text-xs'
              >
                {RANGES.map((value) => (
                  <option key={value} value={value}>
                    {rangeLabel(value)}
                  </option>
                ))}
              </select>
              <button
                type='button'
                onClick={refresh}
                className='inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs'
              >
                <RefreshCw className='size-3.5' />
                {t('Refresh')}
              </button>
              <button
                type='button'
                onClick={() => void toggleFullscreen()}
                className='inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs'
              >
                {fullscreen ? (
                  <Minimize2 className='size-3.5' />
                ) : (
                  <Maximize2 className='size-3.5' />
                )}
                {fullscreen ? t('Exit fullscreen') : t('Fullscreen')}
              </button>
            </div>
          </div>

          {unhealthy > 0 && (
            <div className='mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm'>
              <AlertTriangle className='size-4 text-red-500' />
              <b>
                {unhealthy} {t('unhealthy')}
              </b>
              <span className='text-muted-foreground'>
                {t('channels require attention')}
              </span>
            </div>
          )}

          <div className='grid gap-4 lg:grid-cols-[1.25fr_1fr_1fr]'>
            <FinanceCard
              tone='gold'
              title={t('Total user quota')}
              value={
                usage?.total_user_quota != null
                  ? formatQuota(usage.total_user_quota)
                  : '—'
              }
              subtitle={t('Current balance held by all users')}
              meta={`${t('Users with balance')}: ${usage?.users_with_balance ?? '—'}`}
              extra={`${t('Total users')}: ${usage?.total_users ?? '—'}`}
            />
            <FinanceCard
              tone='green'
              title={t('User charges')}
              value={usage ? formatQuota(usage.charged_quota) : '—'}
              subtitle={t('Selected time range')}
              meta={`${t('Today top-up amount')}: ${money(usage?.today_top_up_amount)}`}
              extra={`${t('Top-up amount in selected range')}: ${money(usage?.top_up_amount)}`}
            />
            <FinanceCard
              tone='blue'
              title={t('Reference profit')}
              value={
                usage && usage.cost_available_requests > 0
                  ? money(usage.reference_profit_usd, 4)
                  : '—'
              }
              subtitle={t('Estimated from configured reference prices')}
              meta={`${t('Reference upstream cost')}: ${money(usage?.reference_cost_usd, 4)}`}
              extra={`${t('Profit margin')}: ${profitMargin}`}
            />
          </div>

          <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className='bg-card/70 rounded-xl border p-4'
              >
                <div className='flex items-center gap-2'>
                  <IconBadge tone={metric.tone} size='sm'>
                    <metric.icon />
                  </IconBadge>
                  <span className='text-muted-foreground text-xs'>
                    {metric.label}
                  </span>
                </div>
                <div className='mt-3 font-mono text-2xl font-semibold tabular-nums'>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          <div className='mt-4 rounded-xl border p-4'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold'>{t('Financial trend')}</h3>
              <span className='text-muted-foreground text-xs'>
                {t('Hourly aggregation')}
              </span>
            </div>
            <div className='mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
              {recentTrend.map((point) => (
                <div
                  key={point.timestamp}
                  className='bg-muted/40 rounded-lg p-3 text-xs'
                >
                  <div className='text-muted-foreground'>
                    {new Date(point.timestamp * 1000).toLocaleTimeString(
                      locale,
                      { hour: '2-digit', minute: '2-digit' }
                    )}
                  </div>
                  <div className='mt-2 font-mono'>
                    {t('Requests')}: {formatNumber(point.requests, locale)}
                  </div>
                  <div className='font-mono text-emerald-600'>
                    {t('Top-up')}: {`$${point.top_up_amount.toFixed(2)}`}
                  </div>
                  <div className='font-mono text-sky-600'>
                    {t('Reference profit')}:{' '}
                    {`$${point.reference_profit_usd.toFixed(4)}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='mt-4 grid gap-4 lg:grid-cols-2'>
            <RankPanel
              title={t('Top models by consumption')}
              hours={hours}
              items={ranking}
            />
            <TaskHealthPanel tasks={operations?.tasks ?? EMPTY_TASK_USAGE} />
          </div>
          <OperationsAuxiliaryPanels
            channels={operations?.channels ?? []}
            statuses={operations?.statuses ?? []}
            redemptions={
              operations?.redemptions ?? { total: 0, enabled: 0, used: 0 }
            }
          />
        </SectionPageLayout.Content>
      </SectionPageLayout>
    </div>
  )
}

function FinanceCard(props: {
  tone: keyof typeof FINANCE_CARD_COLORS
  title: string
  value: string
  subtitle: string
  meta: string
  extra: string
}) {
  return (
    <article
      className={`rounded-2xl border p-6 shadow-lg ${FINANCE_CARD_COLORS[props.tone]}`}
    >
      <h2 className='text-sm font-semibold'>{props.title}</h2>
      <div className='mt-4 font-mono text-4xl font-bold tracking-tight tabular-nums'>
        {props.value}
      </div>
      <div className='text-muted-foreground mt-3 text-xs'>{props.subtitle}</div>
      <div className='mt-5 flex justify-between gap-3 text-xs'>
        <span>{props.meta}</span>
        <span>{props.extra}</span>
      </div>
    </article>
  )
}

function RankPanel(props: {
  title: string
  hours: number
  items: Array<[string, number]>
}) {
  const { t } = useTranslation()
  const max = props.items[0]?.[1] || 1
  return (
    <div className='rounded-xl border p-4'>
      <div className='flex items-center justify-between gap-3'>
        <h3 className='font-semibold'>{props.title}</h3>
        <Link
          to='/dashboard/$section'
          params={{ section: 'models' }}
          search={{ hours: props.hours }}
          className='text-muted-foreground hover:text-foreground shrink-0 text-xs underline-offset-4 hover:underline'
        >
          {t('View model analytics')}
        </Link>
      </div>
      <div className='mt-3 space-y-4'>
        {props.items.length === 0 && (
          <span className='text-muted-foreground text-sm'>{t('No data')}</span>
        )}
        {props.items.slice(0, 6).map(([name, value]) => (
          <div key={name}>
            <div className='flex justify-between text-xs'>
              <span>{name}</span>
              <span className='font-mono'>{formatQuota(value)}</span>
            </div>
            <div className='bg-muted mt-1.5 h-1.5 rounded-full'>
              <div
                className='h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400'
                style={{ width: `${Math.max(8, (value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
