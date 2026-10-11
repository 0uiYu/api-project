import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Activity,
  Coins,
  KeyRound,
  Timer,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { IconBadge, type IconBadgeTone } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getUserQuotaDates } from '@/features/dashboard/api'
import type { QuotaDataItem } from '@/features/dashboard/types'
import { getApiKeys } from '@/features/keys/api'
import { getPerfMetricsSummary } from '@/features/performance-metrics/api'
import { getUserLogStats } from '@/features/usage-logs/api'
import { toIntlLocale } from '@/i18n/languages'
import { getUserGroups } from '@/lib/api'
import { formatCompactNumber, formatNumber, formatQuota } from '@/lib/format'
import { requireServerSuccess } from '@/lib/server-error-message'
import { dateToUnixTimestamp, getStartOfDay } from '@/lib/time'
import { useAuthStore } from '@/stores/auth-store'

interface DashboardStat {
  key: string
  title: string
  value: string
  description: string
  icon: LucideIcon
  tone: IconBadgeTone
  loading: boolean
  /** Opens the account balance page. Only the balance card uses this. */
  rechargeTo?: '/wallet'
  /** Opens the API key page on the create form. Only the keys card uses this. */
  createKeyTo?: '/keys'
}

function sumQuotaData(data: QuotaDataItem[] | undefined) {
  return (data ?? []).reduce(
    (totals, item) => ({
      quota: totals.quota + (Number(item.quota) || 0),
      count: totals.count + (Number(item.count) || 0),
      tokens: totals.tokens + (Number(item.token_used) || 0),
    }),
    { quota: 0, count: 0, tokens: 0 }
  )
}

/**
 * Account, usage and performance summary for the data dashboard.
 *
 * Every number is read from an existing aggregate endpoint; nothing is
 * estimated on the client except the "standard price" split, which converts
 * the billed quota back to list price with the user's group ratio.
 */
export function StatCards() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)

  const remainQuota = Number(user?.quota ?? 0)
  const usedQuota = Number(user?.used_quota ?? 0)
  const totalRequests = Number(user?.request_count ?? 0)
  const userGroup = user?.group ?? ''

  const todayRange = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    return { start: dateToUnixTimestamp(getStartOfDay()), end: now }
  }, [])

  const todayQuery = useQuery({
    queryKey: ['dashboard', 'stat-cards', 'today', todayRange.start],
    queryFn: async () =>
      requireServerSuccess(
        await getUserQuotaDates({
          start_timestamp: todayRange.start,
          end_timestamp: todayRange.end,
          default_time: 'hour',
        })
      ),
    staleTime: 60 * 1000,
  })

  // /api/data/self rejects spans longer than 2,592,000 seconds.
  const recentRange = useMemo(
    () => ({
      start: todayRange.end - 2_592_000,
      end: todayRange.end,
    }),
    [todayRange.end]
  )

  const recentQuery = useQuery({
    queryKey: ['dashboard', 'stat-cards', 'recent', recentRange.start],
    queryFn: async () =>
      requireServerSuccess(
        await getUserQuotaDates({
          start_timestamp: recentRange.start,
          end_timestamp: recentRange.end,
          default_time: 'day',
        })
      ),
    staleTime: 10 * 60 * 1000,
  })

  const keysQuery = useQuery({
    queryKey: ['dashboard', 'stat-cards', 'api-keys'],
    queryFn: async () =>
      requireServerSuccess(await getApiKeys({ p: 1, size: 100 })),
    staleTime: 60 * 1000,
  })

  const groupsQuery = useQuery({
    queryKey: ['dashboard', 'stat-cards', 'groups'],
    queryFn: async () => requireServerSuccess(await getUserGroups()),
    staleTime: 5 * 60 * 1000,
  })

  const rateQuery = useQuery({
    queryKey: ['dashboard', 'stat-cards', 'rates'],
    queryFn: async () => requireServerSuccess(await getUserLogStats({})),
    staleTime: 60 * 1000,
  })

  const perfQuery = useQuery({
    queryKey: ['dashboard', 'stat-cards', 'perf', 24],
    queryFn: async () => requireServerSuccess(await getPerfMetricsSummary(24)),
    staleTime: 60 * 1000,
    retry: false,
  })

  const formatCount = useCallback(
    (value: number) => {
      const text = formatNumber(value, locale)
      return text.length > 10 ? formatCompactNumber(value, locale) : text
    },
    [locale]
  )

  const today = sumQuotaData(todayQuery.data?.data)
  const recent = sumQuotaData(recentQuery.data?.data)
  const recentTokens = Math.max(recent.tokens, today.tokens)

  const groupRatio = useMemo(() => {
    const ratio = groupsQuery.data?.data?.[userGroup]?.ratio
    const parsed = typeof ratio === 'string' ? Number(ratio) : ratio
    if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed <= 0) {
      return 1
    }
    return parsed
  }, [groupsQuery.data?.data, userGroup])

  const toStandardQuota = useCallback(
    (quota: number) => quota / groupRatio,
    [groupRatio]
  )

  const keys = keysQuery.data?.data?.items ?? []
  const totalKeys = keysQuery.data?.data?.total ?? keys.length
  const enabledKeys = keys.filter((item) => item.status === 1).length

  const rpm = Number(rateQuery.data?.data?.rpm ?? 0)
  const tpm = Number(rateQuery.data?.data?.tpm ?? 0)
  const avgLatency = Number(perfQuery.data?.data?.summary?.avg_latency_ms ?? 0)
  const successRate = Number(perfQuery.data?.data?.summary?.success_rate ?? 0)

  const todayStandard = toStandardQuota(today.quota)
  const usedStandard = toStandardQuota(usedQuota)
  const tokensPerRequest =
    recent.count > 0 ? Math.round(recentTokens / recent.count) : 0
  const todayTokensPerRequest =
    today.count > 0 ? Math.round(today.tokens / today.count) : 0

  const stats: DashboardStat[] = [
    {
      key: 'balance',
      title: t('Balance'),
      value: formatQuota(remainQuota),
      description: t('Available'),
      icon: Wallet,
      tone: 'success',
      loading: false,
      rechargeTo: '/wallet',
    },
    {
      key: 'keys',
      title: t('API Keys'),
      value: formatNumber(totalKeys, locale),
      description: t('{{count}} enabled', { count: enabledKeys }),
      icon: KeyRound,
      tone: 'info',
      loading: keysQuery.isPending,
      createKeyTo: '/keys',
    },
    {
      key: 'requests-today',
      title: t('Requests today'),
      value: formatCount(today.count),
      description: `${t('Total')}: ${formatCount(totalRequests)}`,
      icon: Activity,
      tone: 'chart-4',
      loading: todayQuery.isPending,
    },
    {
      key: 'spend-today',
      title: t('Spend today'),
      value: `${formatQuota(today.quota)} / ${formatQuota(todayStandard)}`,
      description: `${t('Total')}: ${formatQuota(usedQuota)} / ${formatQuota(usedStandard)}`,
      icon: Coins,
      tone: 'warning',
      loading: todayQuery.isPending,
    },
    {
      key: 'tokens-today',
      title: t('Tokens today'),
      value: formatCount(today.tokens),
      description: `${formatCount(todayTokensPerRequest)} ${t('Tokens')} / ${t('Requests')}`,
      icon: Zap,
      tone: 'chart-1',
      loading: todayQuery.isPending,
    },
    {
      key: 'tokens-total',
      title: t('Tokens in 30 days'),
      value: formatCount(recentTokens),
      description: `${formatCount(tokensPerRequest)} ${t('Tokens')} / ${t('Requests')}`,
      icon: Zap,
      tone: 'chart-2',
      loading: recentQuery.isPending,
    },
    {
      key: 'rates',
      title: t('Performance metrics'),
      value: `${formatCount(rpm)} RPM`,
      description: `${formatCount(tpm)} TPM`,
      icon: Timer,
      tone: 'destructive',
      loading: rateQuery.isPending,
    },
    {
      key: 'latency',
      title: t('Average response time'),
      value: `${formatCount(Math.round(avgLatency))} ms`,
      description: `${t('Success rate')} ${successRate.toFixed(1)}%`,
      icon: Timer,
      tone: 'neutral',
      loading: perfQuery.isPending,
    },
  ]

  return (
    <div className='grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4'>
      {stats.map((stat) => {
        const Icon = stat.icon

        return (
          <div
            key={stat.key}
            data-card-hover='false'
            className='bg-card min-w-0 rounded-2xl border p-3 shadow-xs sm:p-4'
          >
            <div className='flex min-w-0 items-center gap-2'>
              <IconBadge tone={stat.tone} size='md'>
                <Icon />
              </IconBadge>
              <span className='text-muted-foreground min-w-0 flex-1 truncate text-xs font-medium sm:text-sm'>
                {stat.title}
              </span>
              {stat.rechargeTo ? (
                <Button
                  variant='outline'
                  size='xs'
                  className='shrink-0'
                  render={<Link to={stat.rechargeTo} />}
                >
                  {t('Recharge')}
                </Button>
              ) : null}
              {stat.createKeyTo ? (
                <Button
                  variant='outline'
                  size='xs'
                  className='shrink-0'
                  render={<Link to={stat.createKeyTo} search={{ create: 1 }} />}
                >
                  {t('Create API Key')}
                </Button>
              ) : null}
            </div>

            {stat.loading ? (
              <Skeleton className='mt-3 h-6 w-20 sm:h-7 sm:w-24' />
            ) : (
              <div
                className='text-foreground mt-2 truncate font-mono text-lg font-semibold tracking-tight tabular-nums sm:mt-3 sm:text-2xl'
                title={stat.value}
              >
                {stat.value}
              </div>
            )}

            <div
              className='text-muted-foreground/80 mt-1 truncate text-[11px] sm:text-xs'
              title={stat.description}
            >
              {stat.description}
            </div>
          </div>
        )
      })}
    </div>
  )
}
