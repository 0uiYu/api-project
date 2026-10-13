import { RefreshCw } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { getUserQuotaDates } from '@/features/dashboard/api'
import type { QuotaDataItem } from '@/features/dashboard/types'
import { ROLE } from '@/lib/roles'
import { computeTimeRange, type TimeGranularity } from '@/lib/time'
import { useAuthStore } from '@/stores/auth-store'

const LazyConsumptionDistributionChart = lazy(() =>
  import('../models/consumption-distribution-chart').then((m) => ({
    default: m.ConsumptionDistributionChart,
  }))
)

type UsageRange = 'today' | '7d' | '30d'

const RANGE_CONFIG: Record<
  UsageRange,
  { days: number; granularity: TimeGranularity; labelKey: string }
> = {
  today: { days: 1, granularity: 'hour', labelKey: 'Today' },
  '7d': { days: 7, granularity: 'day', labelKey: 'Last 7 Days' },
  '30d': { days: 30, granularity: 'day', labelKey: 'Last 30 Days' },
}

function UsageChartFallback() {
  return (
    <div className='overflow-hidden rounded-lg border'>
      <div className='flex items-center justify-between border-b px-4 py-3 sm:px-5'>
        <Skeleton className='h-5 w-32' />
        <Skeleton className='h-8 w-40' />
      </div>
      <div className='h-[300px] p-2 sm:h-96'>
        <Skeleton className='h-full w-full' />
      </div>
    </div>
  )
}

/**
 * A single usage trend keeps the dashboard useful without turning it into an
 * analytics workspace. Detailed model analytics remain available to admins.
 */
export function UsageTrends() {
  const { t } = useTranslation()
  const userRole = useAuthStore((state) => state.auth.user?.role)
  const isAdmin = Boolean(userRole && userRole >= ROLE.ADMIN)
  const [range, setRange] = useState<UsageRange>('7d')
  const [data, setData] = useState<QuotaDataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reloadToken, setReloadToken] = useState(0)

  const granularity = RANGE_CONFIG[range].granularity
  const timeRange = useMemo(
    () => computeTimeRange(RANGE_CONFIG[range].days),
    [range]
  )

  useEffect(() => {
    const abortController = new AbortController()
    setLoading(true)

    void getUserQuotaDates(
      {
        start_timestamp: timeRange.start_timestamp,
        end_timestamp: timeRange.end_timestamp,
        default_time: granularity,
      },
      isAdmin
    )
      .then((res) => {
        if (abortController.signal.aborted) return
        setData(res?.data ?? [])
      })
      .catch(() => {
        if (abortController.signal.aborted) return
        setData([])
      })
      .finally(() => {
        if (!abortController.signal.aborted) setLoading(false)
      })

    return () => abortController.abort()
  }, [granularity, isAdmin, reloadToken, timeRange])

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='text-muted-foreground text-xs font-medium sm:text-sm'>
          {t('Time range')}
        </span>
        <div className='flex items-center gap-2'>
          <ToggleGroup
            value={[range]}
            onValueChange={(values) => {
              const next = values.find((value) => value !== range)
              if (next) setRange(next as UsageRange)
            }}
            variant='outline'
            size='sm'
            aria-label={t('Time range')}
          >
            {(Object.keys(RANGE_CONFIG) as UsageRange[]).map((key) => (
              <ToggleGroupItem key={key} value={key}>
                {t(RANGE_CONFIG[key].labelKey)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='gap-1.5'
            disabled={loading}
            onClick={() => setReloadToken((token) => token + 1)}
          >
            <RefreshCw data-icon='inline-start' />
            {t('Refresh')}
          </Button>
        </div>
      </div>

      <Suspense fallback={<UsageChartFallback />}>
        <LazyConsumptionDistributionChart
          data={data}
          loading={loading}
          timeGranularity={granularity}
          timeRange={{
            start: timeRange.start_timestamp,
            end: timeRange.end_timestamp,
          }}
        />
      </Suspense>

    </div>
  )
}
