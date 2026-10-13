import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { USER_PORTAL_CARD_CLASS } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Skeleton } from '@/components/ui/skeleton'
import { buildCsv, downloadCsv } from '@/features/wallet/lib/csv'
import { formatQuota } from '@/lib/format'
import { getUserQuotaDates } from '@/features/dashboard/api'
import type {
  ConsumptionMetric,
  QuotaDataItem,
} from '@/features/dashboard/types'
import { TrendDateRangePicker } from './trend-date-range-picker'
import { requireServerSuccess } from '@/lib/server-error-message'
import {
  computeTimeRange,
  dateToUnixTimestamp,
  formatChartTime,
  getEndOfDay,
  getStartOfDay,
  type TimeGranularity,
} from '@/lib/time'
import { cn } from '@/lib/utils'

const LazyConsumptionDistributionChart = lazy(() =>
  import('@/features/dashboard/components/models/consumption-distribution-chart').then(
    (m) => ({ default: m.ConsumptionDistributionChart })
  )
)

const PRESETS = [
  { id: 'today', labelKey: 'Today', days: 1, granularity: 'hour' },
  { id: '7d', labelKey: 'Last 7 Days', days: 7, granularity: 'day' },
  { id: '30d', labelKey: 'Last 30 Days', days: 30, granularity: 'day' },
] as const

type RangeId = (typeof PRESETS)[number]['id'] | 'custom'

/** What the bars measure, in the order the dropdown offers them. */
const METRICS = [
  { id: 'quota', labelKey: 'Spend amount' },
  { id: 'count', labelKey: 'Request count' },
  { id: 'tokens', labelKey: 'Token usage' },
] as const

function TrendFallback() {
  return <Skeleton className='h-[300px] w-full sm:h-96' />
}

/**
 * Consumption bars with two filters: a time window (three presets or a custom
 * range) and a model picked from the models present in the returned rows.
 */
export function ConsumptionTrend() {
  const { t } = useTranslation()
  const [rangeId, setRangeId] = useState<RangeId>('7d')
  const [custom, setCustom] = useState<{ start?: Date; end?: Date }>({})
  const [model, setModel] = useState('')
  const [metric, setMetric] = useState<ConsumptionMetric>('quota')

  const window = useMemo(() => {
    if (rangeId === 'custom') {
      const endDate = custom.end ?? new Date()
      const startDate =
        custom.start ?? new Date(endDate.getTime() - 7 * 86_400_000)
      const end = getEndOfDay(endDate)
      const start = getStartOfDay(startDate)
      const spanDays = Math.max(
        1,
        (end.getTime() - start.getTime()) / 86_400_000
      )
      return {
        start: dateToUnixTimestamp(start),
        end: dateToUnixTimestamp(end),
        granularity: (spanDays <= 2 ? 'hour' : 'day') as TimeGranularity,
      }
    }
    const preset = PRESETS.find((item) => item.id === rangeId) ?? PRESETS[1]
    const range = computeTimeRange(preset.days)
    return {
      start: range.start_timestamp,
      end: range.end_timestamp,
      granularity: preset.granularity as TimeGranularity,
    }
  }, [rangeId, custom])

  const query = useQuery({
    queryKey: ['dashboard', 'consumption-trend', window.start, window.end],
    queryFn: async () =>
      requireServerSuccess(
        await getUserQuotaDates({
          start_timestamp: window.start,
          end_timestamp: window.end,
          default_time: window.granularity,
        })
      ),
    staleTime: 60 * 1000,
  })

  const rows: QuotaDataItem[] = useMemo(
    () => query.data?.data ?? [],
    [query.data]
  )

  // The model list is read straight from the rows the chart is drawing.
  const modelOptions = useMemo(() => {
    const names = [
      ...new Set(
        rows.map((row) => row.model_name).filter((name): name is string =>
          Boolean(name)
        )
      ),
    ].sort((left, right) => left.localeCompare(right))
    return [
      { value: '', label: t('All models') },
      ...names.map((name) => ({ value: name, label: name })),
    ]
  }, [rows, t])

  const filtered = useMemo(() => {
    if (!model) return rows
    return rows.filter((row) => row.model_name === model)
  }, [rows, model])

  return (
    <section className={cn(USER_PORTAL_CARD_CLASS, 'flex flex-col gap-4')}>
      <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-3'>
        <h2 className='text-base font-semibold'>{t('Consumption trend')}</h2>
        <div className='flex flex-wrap items-center gap-2'>
          <div
            className='flex items-center gap-1'
            role='group'
            aria-label={t('Time range')}
          >
            {PRESETS.map((item) => {
              const active = item.id === rangeId
              return (
                <button
                  key={item.id}
                  type='button'
                  aria-pressed={active}
                  onClick={() => setRangeId(item.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs transition-colors',
                    active
                      ? 'border-[var(--portal-brand)] bg-[var(--portal-brand-soft)] font-medium text-[var(--portal-brand)]'
                      : 'border-[var(--portal-border)] text-[var(--portal-muted)] hover:border-[var(--portal-brand)] hover:text-[var(--portal-text)]'
                  )}
                >
                  {t(item.labelKey)}
                </button>
              )
            })}
            {/* Picking a range here also selects the custom mode. */}
            <TrendDateRangePicker
              start={custom.start}
              end={custom.end}
              active={rangeId === 'custom'}
              onChange={(range) => {
                setCustom(range)
                setRangeId('custom')
              }}
            />
          </div>

          <div className='w-full sm:w-48'>
            <Combobox
              options={modelOptions}
              value={model}
              onValueChange={(value) => setModel(value ?? '')}
              placeholder={t('All models')}
              searchPlaceholder={t('Model name')}
            />
          </div>

          <div className='w-full sm:w-40'>
            <Combobox
              options={METRICS.map((item) => ({
                value: String(item.id),
                label: t(item.labelKey),
              }))}
              value={String(metric)}
              onValueChange={(value) =>
                setMetric((value as ConsumptionMetric) ?? 'quota')
              }
              placeholder={t('Metric')}
              searchPlaceholder={t('Metric')}
            />
          </div>

          {/* The usage page was only this data in a table, so the export lives
              with the chart that draws it. */}
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='gap-1.5'
            disabled={filtered.length === 0}
            onClick={() => {
              const csv = buildCsv(
                [
                  t('Time'),
                  t('Model'),
                  t('Request count'),
                  t('Spend amount'),
                  t('Token usage'),
                ],
                filtered.map((row) => [
                  formatChartTime(Number(row.created_at), window.granularity),
                  row.model_name ?? '',
                  String(Number(row.count) || 0),
                  formatQuota(Number(row.quota) || 0),
                  String(Number(row.token_used) || 0),
                ])
              )
              const from = formatChartTime(window.start, 'day').replaceAll('-', '')
              const to = formatChartTime(window.end, 'day').replaceAll('-', '')
              downloadCsv(`consumption-${from}-${to}.csv`, csv)
            }}
          >
            <Download data-icon='inline-start' />
            {t('Export')}
          </Button>
        </div>
      </div>

      {query.isError ? (
        <p className='text-sm text-[var(--portal-muted)]'>
          {t('Failed to load usage data')}
        </p>
      ) : (
        <Suspense fallback={<TrendFallback />}>
          <LazyConsumptionDistributionChart
            bare
            metric={metric}
            data={filtered}
            loading={query.isPending}
            timeGranularity={window.granularity}
            timeRange={{ start: window.start, end: window.end }}
          />
        </Suspense>
      )}
    </section>
  )
}
