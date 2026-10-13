import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { USER_PORTAL_CARD_CLASS } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useApiKeySummary } from '@/features/keys/hooks'
import { getUserLogStats } from '@/features/usage-logs/api'
import { toIntlLocale } from '@/i18n/languages'
import { formatNumber, formatQuota, formatTokens } from '@/lib/format'
import { requireServerSuccess } from '@/lib/server-error-message'
import { useAuthStore } from '@/stores/auth-store'

interface DashboardStat {
  key: string
  title: string
  value: string
  description: string
  loading: boolean
}

/**
 * The four numbers an API user checks first: what is left, what has been spent,
 * how many keys exist, and how many tokens the account has ever used. Every
 * value comes from an existing endpoint; nothing is estimated on the client.
 */
export function StatCards() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)

  const keys = useApiKeySummary()

  // No time window: the statistics endpoint then sums every consume log, which
  // is what "cumulative" means here.
  const tokenQuery = useQuery({
    queryKey: ['dashboard', 'stat-cards', 'lifetime-tokens'],
    queryFn: async () => requireServerSuccess(await getUserLogStats({})),
    staleTime: 60 * 1000,
  })

  const remainQuota = Number(user?.quota ?? 0)
  const usedQuota = Number(user?.used_quota ?? 0)
  const totalTokens = Number(tokenQuery.data?.data?.token ?? 0)
  const stats: DashboardStat[] = [
    {
      key: 'balance',
      title: t('Account balance'),
      value: formatQuota(remainQuota),
      description: '',
      loading: false,
    },
    {
      key: 'spent',
      title: t('Total spent'),
      value: formatQuota(usedQuota),
      description: '',
      loading: false,
    },
    {
      key: 'keys',
      title: t('API Keys'),
      value: formatNumber(keys.total, locale),
      description: '',
      loading: keys.isLoading,
    },
    {
      key: 'tokens',
      title: t('Total tokens'),
      value: tokenQuery.isError ? '—' : formatTokens(totalTokens),
      description: '',
      loading: tokenQuery.isPending,
    },
  ]

  return (
    <div className='flex flex-col gap-3'>
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
        {stats.map((stat) => (
          <div
            key={stat.key}
            data-card-hover='false'
            className={`${USER_PORTAL_CARD_CLASS} relative`}
          >
            {/* Recharge sits on the balance card: that is where the user looks
                the moment the number is too small. */}
            {stat.key === 'balance' ? (
              <Button
                size='sm'
                className='absolute top-[16px] right-[16px]'
                render={<Link to='/wallet' />}
              >
                {t('Go to recharge')}
              </Button>
            ) : null}
            {stat.key === 'keys' ? (
              <Button
                size='sm'
                className='absolute top-[16px] right-[16px]'
                render={<Link to='/keys' search={{ create: 1 }} />}
              >
                {t('Go to create API key')}
              </Button>
            ) : null}
            <div className='text-sm text-[var(--portal-muted)]'>
              {stat.title}
            </div>

            {stat.loading ? (
              <Skeleton className='mt-2 h-8 w-24' />
            ) : (
              <div
                className='mt-1.5 truncate text-[32px] leading-tight font-bold tracking-tight tabular-nums'
                title={stat.value}
              >
                {stat.value}
              </div>
            )}

            {stat.description ? (
              <div
                className='mt-1.5 truncate text-xs text-[var(--portal-muted)]'
                title={stat.description}
              >
                {stat.description}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {tokenQuery.isError ? (
        <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-[var(--portal-border)] px-3 py-2 text-xs text-[var(--portal-muted)]'>
          <span>{t('Failed to load usage data')}</span>
          <Button
            variant='outline'
            size='xs'
            onClick={() => void tokenQuery.refetch()}
          >
            {t('Retry')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
