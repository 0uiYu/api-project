import { VChart } from '@visactor/react-vchart'
import { WalletCards } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { IconBadge } from '@/components/ui/icon-badge'
import { useThemeCustomization } from '@/context/theme-customization-provider'
import { useTheme } from '@/context/theme-provider'
import {
  DEFAULT_TIME_GRANULARITY,
} from '@/features/dashboard/constants'
import { processChartData } from '@/features/dashboard/lib'
import type {
  ConsumptionMetric,
  QuotaDataItem,
} from '@/features/dashboard/types'
import { useThemeRadiusPx } from '@/lib/theme-radius'
import type { TimeGranularity } from '@/lib/time'
import { VCHART_OPTION } from '@/lib/vchart'

let themeManagerPromise: Promise<
  (typeof import('@visactor/vchart'))['ThemeManager']
> | null = null

interface ConsumptionDistributionChartProps {
  data: QuotaDataItem[]
  loading?: boolean
  timeGranularity?: TimeGranularity
  timeRange?: { start: number; end: number }
  /**
   * Render the bars alone: no header and no border. The user portal shows one
   * bar chart and never offers the area variant.
   */
  bare?: boolean
  /** What the bars measure. Only the bar variant honours it. */
  metric?: ConsumptionMetric
}

export function ConsumptionDistributionChart(
  props: ConsumptionDistributionChartProps
) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const { customization } = useThemeCustomization()
  const chartRadius = useThemeRadiusPx(
    '--radius-md',
    `${customization.preset}:${customization.radius}`
  )
  const [themeReady, setThemeReady] = useState(false)
  const themeManagerRef = useRef<
    (typeof import('@visactor/vchart'))['ThemeManager'] | null
  >(null)
  const timeGranularity = props.timeGranularity ?? DEFAULT_TIME_GRANULARITY

  useEffect(() => {
    const updateTheme = async () => {
      setThemeReady(false)

      if (!themeManagerPromise) {
        themeManagerPromise = import('@visactor/vchart').then(
          (m) => m.ThemeManager
        )
      }

      const ThemeManager = await themeManagerPromise
      themeManagerRef.current = ThemeManager
      ThemeManager.setCurrentTheme(resolvedTheme === 'dark' ? 'dark' : 'light')
      setThemeReady(true)
    }

    updateTheme()
  }, [resolvedTheme])

  const chartData = useMemo(
    () =>
      processChartData(
        props.loading ? [] : props.data,
        timeGranularity,
        t,
        chartRadius,
        props.timeRange,
        props.metric ?? 'quota'
      ),
    [
      props.data,
      props.loading,
      props.timeRange,
      timeGranularity,
      t,
      chartRadius,
      props.metric,
    ]
  )
  const activeType = 'bar'
  const spec = chartData.spec_line
  const specType = typeof spec?.type === 'string' ? spec.type : activeType
  const chartKey = [
    activeType,
    props.metric ?? 'quota',
    specType,
    props.loading ? 'loading' : 'ready',
    props.data.length,
    resolvedTheme,
    customization.preset,
  ].join('-')

  const chartBody = (
    <div className='h-[300px] w-full p-1.5 sm:h-96 sm:p-2'>
      {themeReady && spec && (
        <VChart
          key={chartKey}
          spec={{
            ...spec,
            theme: resolvedTheme === 'dark' ? 'dark' : 'light',
            background: 'transparent',
          }}
          option={VCHART_OPTION}
        />
      )}
    </div>
  )

  if (props.bare) return chartBody

  return (
    <div className='overflow-hidden rounded-lg border'>
      <div className='flex w-full flex-col gap-1.5 border-b px-3 py-2 sm:gap-3 sm:px-5 sm:py-3 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex items-center gap-2'>
          <IconBadge tone='success' size='sm'>
            <WalletCards />
          </IconBadge>
          <div className='text-sm font-semibold'>{t('Quota Distribution')}</div>
          <span className='text-muted-foreground text-xs'>
            {t('Total')}: {chartData.totalQuotaDisplay}
          </span>
        </div>

      </div>

      {chartBody}
    </div>
  )
}
