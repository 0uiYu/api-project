import { dataScheme as vchartDefaultDataScheme } from '@visactor/vchart/esm/theme/color-scheme/builtin/default'

import { MAX_CHART_TREND_POINTS } from '@/features/dashboard/constants'
import type {
  ConsumptionMetric,
  QuotaDataItem,
  ProcessedChartData,
} from '@/features/dashboard/types'
import { getCurrencyDisplay } from '@/lib/currency'
import { formatChartTime, type TimeGranularity } from '@/lib/time'

const chartTimeAxis = {
  orient: 'bottom' as const,
  type: 'band' as const,
  label: { visible: true, autoRotate: true },
}
const chartValueAxis = {
  orient: 'left' as const,
  type: 'linear' as const,
}

function chartStepSeconds(granularity: TimeGranularity) {
  if (granularity === 'hour') return 3600
  if (granularity === 'week') return 604800
  return 86400
}

/** Dated buckets for a chart axis, including ranges that have no usage rows. */
function buildChartAxisLabels(
  granularity: TimeGranularity,
  range?: { start: number; end: number }
) {
  const step = chartStepSeconds(granularity)
  const end = range?.end ?? Math.floor(Date.now() / 1000)
  let fallbackSteps = 6
  if (granularity === 'hour') fallbackSteps = 23
  if (granularity === 'week') fallbackSteps = 4
  const start = range?.start ?? end - step * fallbackSteps
  const last = Math.max(start, end)
  const labels: string[] = []

  for (let ts = start; ts <= last && labels.length < 48; ts += step) {
    if (!Number.isFinite(ts)) break
    const label = formatChartTime(ts, granularity)
    if (!label || label === 'Invalid Date' || labels.at(-1) === label) continue
    labels.push(label)
  }

  if (labels.length === 0 && Number.isFinite(end)) {
    const label = formatChartTime(end, granularity)
    if (label && label !== 'Invalid Date') labels.push(label)
  }

  return labels
}

type TFunction = (key: string) => string
type TooltipLineItem = {
  key: string
  value: string | number
  datum?: Record<string, unknown>
  hasShape?: boolean
  shapeType?: string
  shapeFill?: string
  shapeStroke?: string
  shapeSize?: number
}

export function getDashboardChartColors(domainLength: number): string[] {
  const scheme =
    vchartDefaultDataScheme.find(
      (item) => !item.maxDomainLength || domainLength <= item.maxDomainLength
    ) ?? vchartDefaultDataScheme.at(-1)

  return (scheme?.scheme ?? []).filter(
    (color): color is string => typeof color === 'string'
  )
}

function renderQuotaCompat(rawQuota: number, digits = 4): string {
  const { config, meta } = getCurrencyDisplay()
  if (meta.kind === 'tokens') return rawQuota.toLocaleString()
  const usd = rawQuota / config.quotaPerUnit
  const rate = 'exchangeRate' in meta ? meta.exchangeRate : 1
  const symbol = 'symbol' in meta ? meta.symbol : '$'
  const value = usd * rate
  const fixed = value.toFixed(digits)
  if (Number.parseFloat(fixed) === 0 && rawQuota > 0 && value > 0) {
    return symbol + Math.pow(10, -digits).toFixed(digits)
  }
  return symbol + fixed
}

/**
 * Process and aggregate chart data
 */
export function processChartData(
  data: QuotaDataItem[],
  timeGranularity: TimeGranularity = 'day',
  t?: TFunction,
  chartCornerRadius?: number,
  axisRange?: { start: number; end: number },
  metric: ConsumptionMetric = 'quota'
): ProcessedChartData {
  const tt: TFunction = t ?? ((x) => x)
  const otherLabel = tt('Other')

  const formatInt = (value: number) =>
    Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)
  const formatQuotaValue = (value: number) => renderQuotaCompat(value, 4)
  const formatQuotaTotal = (value: number) => renderQuotaCompat(value, 2)

  // Metric-aware plumbing for the consumption bars: the plotted value and the
  // tooltip always describe the same thing, so the axis can never disagree
  // with the numbers inside it.
  const rawOf = (datum: Record<string, unknown> | undefined) => {
    if (metric === 'count') return Number(datum?.count) || 0
    if (metric === 'tokens') return Number(datum?.tokenUsed) || 0
    return Number(datum?.rawQuota) || 0
  }
  const formatMetric = (value: number) =>
    metric === 'quota' ? formatQuotaValue(value) : formatInt(value)

  const MAX_TOOLTIP_MODELS = 15
  const isOtherTooltipKey = (key: string) =>
    key === 'Other' || key === otherLabel

  const makeTooltipDimensionUpdateContent = (options?: {
    collapseOverflow?: boolean
  }) => {
    const collapseOverflow = options?.collapseOverflow ?? true

    return (array: TooltipLineItem[]) => {
      const modelItems = array.filter((item) => !isOtherTooltipKey(item.key))
      const otherItems = array.filter((item) => isOtherTooltipKey(item.key))
      modelItems.sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
      array = [...modelItems, ...otherItems]

      let sum = 0
      for (let i = 0; i < array.length; i++) {
        const v = Number(array[i].value) || 0
        if (
          array[i].datum &&
          (array[i].datum as Record<string, unknown>)?.TimeSum
        ) {
          sum =
            Number((array[i].datum as Record<string, unknown>)?.TimeSum) || sum
        }
        array[i].value = formatMetric(v)
      }

      if (collapseOverflow && array.length > MAX_TOOLTIP_MODELS) {
        const visible = modelItems.slice(0, MAX_TOOLTIP_MODELS)
        const otherSum = [
          ...modelItems.slice(MAX_TOOLTIP_MODELS),
          ...otherItems,
        ].reduce((sum, item) => {
          const raw = item.datum ? rawOf(item.datum) : 0
          return sum + raw
        }, 0)
        array = [
          ...visible,
          {
            key: otherLabel,
            value: formatMetric(otherSum),
            hasShape: true,
            shapeType: 'square',
            shapeFill: otherTooltipColor,
            shapeStroke: otherTooltipColor,
            shapeSize: 8,
          },
        ]
      }

      array.unshift({
        key: `${tt('Total')}:`,
        value: formatQuotaValue(sum),
      })
      return array
    }
  }

  if (!data || data.length === 0) {
    const axisLabels = buildChartAxisLabels(timeGranularity, axisRange)
    const emptyUsage = axisLabels.map((time) => ({ Time: time, Usage: 0 }))
    const emptyCounts = axisLabels.map((time) => ({ Time: time, Count: 0 }))
    return {
      spec_pie: {
        type: 'pie',
        data: [{ id: 'id0', values: [] }],
        outerRadius: 0.8,
        innerRadius: 0.5,
        padAngle: 0.6,
        valueField: 'value',
        categoryField: 'type',
        title: {
          visible: true,
          text: tt('Call Count Distribution'),
          subtext: tt('No data available'),
        },
        legends: { visible: false },
        label: { visible: false },
        tooltip: {
          mark: {
            content: [],
          },
        },
      },
      spec_line: {
        type: 'bar',
        data: [{ id: 'barData', values: emptyUsage }],
        xField: 'Time',
        yField: 'Usage',
        legends: { visible: false },
        axes: [chartTimeAxis, chartValueAxis],
      },
      spec_area: {
        type: 'area',
        data: [{ id: 'areaData', values: emptyUsage }],
        xField: 'Time',
        yField: 'Usage',
        legends: { visible: false },
        axes: [chartTimeAxis, chartValueAxis],
      },
      spec_model_line: {
        type: 'area',
        data: [{ id: 'lineData', values: emptyCounts }],
        xField: 'Time',
        yField: 'Count',
        legends: { visible: false },
        axes: [chartTimeAxis, chartValueAxis],
        title: {
          visible: true,
          text: tt('Call Trend'),
        },
      },
      spec_rank_bar: {
        type: 'bar',
        data: [{ id: 'rankData', values: [] }],
        xField: 'Model',
        yField: 'Count',
        seriesField: 'Model',
        legends: { visible: true, selectMode: 'single' },
        title: {
          visible: true,
          text: tt('Call Count Ranking'),
        },
      },
      totalQuotaDisplay: formatQuotaTotal(0),
      totalCountDisplay: formatInt(0),
    }
  }

  const { config } = getCurrencyDisplay()
  const quotaPerUnit = config.quotaPerUnit

  // Aggregate all metrics by time and model
  const timeModelMap = new Map<
    string,
    Map<string, { quota: number; count: number; tokens: number }>
  >()
  const modelTotalsMap = new Map<
    string,
    { quota: number; count: number; tokens: number }
  >()
  const timeTimestamps = new Map<string, number>()

  data.forEach((item) => {
    const timestamp = Number(item.created_at)
    const timeKey = formatChartTime(timestamp, timeGranularity)
    timeTimestamps.set(
      timeKey,
      Math.min(timeTimestamps.get(timeKey) ?? timestamp, timestamp)
    )
    const model = item.model_name || 'Unknown'
    const quota = Number(item.quota) || 0
    const count = Number(item.count) || 0
    const tokens = Number(item.token_used) || 0

    // Aggregate by time and model
    let modelMap = timeModelMap.get(timeKey)
    if (!modelMap) {
      modelMap = new Map()
      timeModelMap.set(timeKey, modelMap)
    }
    const existing = modelMap.get(model) || { quota: 0, count: 0, tokens: 0 }
    modelMap.set(model, {
      quota: existing.quota + quota,
      count: existing.count + count,
      tokens: existing.tokens + tokens,
    })

    // Calculate totals
    const totalExisting = modelTotalsMap.get(model) || {
      quota: 0,
      count: 0,
      tokens: 0,
    }
    modelTotalsMap.set(model, {
      quota: totalExisting.quota + quota,
      count: totalExisting.count + count,
      tokens: totalExisting.tokens + tokens,
    })
  })

  const allModels = [...modelTotalsMap.keys()]
  const sortedTimes = [...timeTimestamps]
    .sort((a, b) => a[1] - b[1])
    .map(([time]) => time)
  const sortedModels = [...allModels].sort()
  const modelColorDomain = [...new Set([...sortedModels, otherLabel])]
  const modelColorRange = getDashboardChartColors(modelColorDomain.length)
  const otherColor = modelColorRange[modelColorDomain.indexOf(otherLabel)]
  const otherTooltipColor =
    typeof otherColor === 'string' ? otherColor : '#FF8A00'
  const modelColor = {
    type: 'ordinal',
    domain: modelColorDomain,
    range: modelColorRange,
  }

  // Pad time points if too few (default 7 points)
  const MAX_TREND_POINTS = MAX_CHART_TREND_POINTS
  const fillTimePoints = (times: string[]) => {
    if (times.length >= MAX_TREND_POINTS) return times
    const stamped = data
      .map((item) => Number(item.created_at))
      .filter((value) => Number.isFinite(value) && value > 0)
    const lastTime =
      stamped.length > 0 ? Math.max(...stamped) : Math.floor(Date.now() / 1000)
    let intervalSec = 3600
    if (timeGranularity === 'week') {
      intervalSec = 604800
    } else if (timeGranularity === 'day') {
      intervalSec = 86400
    }
    const padded = Array.from({ length: MAX_TREND_POINTS }, (_, i) =>
      formatChartTime(
        lastTime - (MAX_TREND_POINTS - 1 - i) * intervalSec,
        timeGranularity
      )
    )
    return padded
  }
  const chartTimes = fillTimePoints(sortedTimes)

  const totalTimes = [...modelTotalsMap.values()].reduce(
    (sum, x) => sum + (Number(x.count) || 0),
    0
  )
  const totalQuotaRaw = [...modelTotalsMap.values()].reduce(
    (sum, x) => sum + (Number(x.quota) || 0),
    0
  )

  // Pie chart (model call count proportion)
  const pieValues = [...modelTotalsMap.entries()]
    .map(([model, stats]) => ({
      type: model,
      value: Number(stats.count) || 0,
    }))
    .sort((a, b) => b.value - a.value)

  // Stacked bar: model quota distribution (quota -> USD)
  const lineValues: Array<{
    Time: string
    Model: string
    rawQuota: number
    count: number
    tokenUsed: number
    Usage: number
    TimeSum: number
  }> = []

  chartTimes.forEach((time) => {
    let timeData = sortedModels.map((model) => {
      const stats = timeModelMap.get(time)?.get(model)
      const rawQuota = Number(stats?.quota) || 0
      const count = Number(stats?.count) || 0
      const tokenUsed = Number(stats?.tokens) || 0
      const usd = rawQuota ? rawQuota / quotaPerUnit : 0
      // Match legacy frontend getQuotaWithUnit(..., 4)
      let usage = 0
      if (metric === 'count') {
        usage = count
      } else if (metric === 'tokens') {
        usage = tokenUsed
      } else if (usd) {
        usage = Number(usd.toFixed(4))
      }
      return {
        Time: time,
        Model: model,
        rawQuota,
        count,
        tokenUsed,
        Usage: usage,
        TimeSum: 0,
      }
    })

    // The bucket total and the ordering follow the metric that is plotted, and
    // stay in the metric's own unit so the tooltip total is formatted correctly.
    const timeSum = timeData.reduce((sum, item) => sum + rawOf(item), 0)
    timeData.sort((a, b) => rawOf(b) - rawOf(a))
    timeData = timeData.map((item) => ({ ...item, TimeSum: timeSum }))
    lineValues.push(...timeData)
  })

  // Area chart: top models by quota + "Other" bucket (too many series = unreadable)
  const MAX_AREA_MODELS = 15
  const rankedQuotaModels = [...modelTotalsMap.entries()]
    .map(([model, stats]) => ({
      Model: model,
      Quota: Number(stats.quota) || 0,
    }))
    .sort((a, b) => b.Quota - a.Quota)
  const topAreaModels = new Set(
    rankedQuotaModels.slice(0, MAX_AREA_MODELS).map((m) => m.Model)
  )

  // The area variant stays quota-based: the user portal only renders bars.
  const areaValues: Array<{
    Time: string
    Model: string
    rawQuota: number
    Usage: number
    TimeSum: number
  }> = []
  chartTimes.forEach((time) => {
    const buckets = new Map<string, { rawQuota: number; usage: number }>()
    const modelMap = timeModelMap.get(time)
    let timeSum = 0
    sortedModels.forEach((model) => {
      const stats = modelMap?.get(model)
      const rawQuota = Number(stats?.quota) || 0
      const usd = rawQuota ? rawQuota / quotaPerUnit : 0
      const usage = usd ? Number(usd.toFixed(4)) : 0
      timeSum += rawQuota
      const key = topAreaModels.has(model) ? model : otherLabel
      const prev = buckets.get(key) || { rawQuota: 0, usage: 0 }
      buckets.set(key, {
        rawQuota: prev.rawQuota + rawQuota,
        usage: Number((prev.usage + usage).toFixed(4)),
      })
    })
    for (const [model, vals] of buckets) {
      areaValues.push({
        Time: time,
        Model: model,
        rawQuota: vals.rawQuota,
        Usage: vals.usage,
        TimeSum: timeSum,
      })
    }
  })

  // Line chart: model call trend (top models + "Other" bucket)
  const MAX_TREND_MODELS = 20
  const rankedTrendModels = [...modelTotalsMap.entries()]
    .map(([model, stats]) => ({
      Model: model,
      Count: Number(stats.count) || 0,
    }))
    .sort((a, b) => b.Count - a.Count)
  const topTrendModels = rankedTrendModels
    .slice(0, MAX_TREND_MODELS)
    .map((item) => item.Model)
  const otherTrendModels = rankedTrendModels
    .slice(MAX_TREND_MODELS)
    .map((item) => item.Model)

  const modelLineValues: Array<{
    Time: string
    Model: string
    Count: number
  }> = []
  chartTimes.forEach((time) => {
    const timeData = topTrendModels.map((model) => {
      const stats = timeModelMap.get(time)?.get(model)
      return {
        Time: time,
        Model: model,
        Count: Number(stats?.count) || 0,
      }
    })
    if (otherTrendModels.length > 0) {
      const otherCount = otherTrendModels.reduce((sum, model) => {
        const stats = timeModelMap.get(time)?.get(model)
        return sum + (Number(stats?.count) || 0)
      }, 0)
      timeData.push({
        Time: time,
        Model: otherLabel,
        Count: otherCount,
      })
    }
    modelLineValues.push(...timeData)
  })

  // Rank bar: model call count ranking (top 20 + "Other" bucket)
  const MAX_RANK_MODELS = 20
  const allRankValues = [...modelTotalsMap.entries()]
    .map(([model, stats]) => ({
      Model: model,
      Count: Number(stats.count) || 0,
    }))
    .sort((a, b) => b.Count - a.Count)

  let rankValues: typeof allRankValues
  if (allRankValues.length > MAX_RANK_MODELS) {
    const topModels = allRankValues.slice(0, MAX_RANK_MODELS)
    const otherCount = allRankValues
      .slice(MAX_RANK_MODELS)
      .reduce((sum, item) => sum + item.Count, 0)
    rankValues = [...topModels, { Model: otherLabel, Count: otherCount }]
  } else {
    rankValues = allRankValues
  }

  return {
    spec_pie: {
      type: 'pie',
      data: [{ id: 'id0', values: pieValues }],
      outerRadius: 0.8,
      innerRadius: 0.5,
      padAngle: 0.6,
      valueField: 'value',
      categoryField: 'type',
      pie: {
        style:
          chartCornerRadius == null ? {} : { cornerRadius: chartCornerRadius },
        state: {
          hover: { outerRadius: 0.85, stroke: '#000', lineWidth: 1 },
          selected: { outerRadius: 0.85, stroke: '#000', lineWidth: 1 },
        },
      },
      title: {
        visible: true,
        text: tt('Call Count Distribution'),
      },
      legends: { visible: true, orient: 'left' },
      label: { visible: true },
      color: modelColor,
      tooltip: {
        mark: {
          content: [
            {
              key: (datum: Record<string, unknown>) => datum?.type,
              value: (datum: Record<string, unknown>) =>
                formatInt(Number(datum?.value) || 0),
            },
          ],
        },
      },
      background: { fill: 'transparent' },
      animation: true,
    },
    spec_line: {
      type: 'bar',
      data: [{ id: 'barData', values: lineValues }],
      xField: 'Time',
      yField: 'Usage',
      seriesField: 'Model',
      stack: true,
      axes: [chartTimeAxis, chartValueAxis],
      legends: { visible: true, selectMode: 'single' },
      color: modelColor,
      bar: {
        state: {
          hover: { stroke: '#000', lineWidth: 1 },
        },
      },
      tooltip: {
        mark: {
          content: [
            {
              key: (datum: Record<string, unknown>) => datum?.Model,
              value: (datum: Record<string, unknown>) =>
                formatMetric(rawOf(datum)),
            },
          ],
        },
        dimension: {
          content: [
            {
              key: (datum: Record<string, unknown>) => datum?.Model,
              value: (datum: Record<string, unknown>) => rawOf(datum),
            },
          ],
          updateContent: makeTooltipDimensionUpdateContent(),
        },
      },
      background: { fill: 'transparent' },
      animation: true,
    },
    spec_area: {
      type: 'area',
      data: [{ id: 'areaData', values: areaValues }],
      xField: 'Time',
      yField: 'Usage',
      seriesField: 'Model',
      stack: false,
      axes: [chartTimeAxis, chartValueAxis],
      legends: { visible: true, selectMode: 'single' },
      color: modelColor,
      tooltip: {
        mark: {
          content: [
            {
              key: (datum: Record<string, unknown>) => datum?.Model,
              value: (datum: Record<string, unknown>) =>
                formatQuotaValue(Number(datum?.rawQuota) || 0),
            },
          ],
        },
        dimension: {
          content: [
            {
              key: (datum: Record<string, unknown>) => datum?.Model,
              value: (datum: Record<string, unknown>) =>
                Number(datum?.rawQuota) || 0,
            },
          ],
          updateContent: makeTooltipDimensionUpdateContent({
            collapseOverflow: false,
          }),
        },
      },
      area: {
        style: {
          fillOpacity: 0.08,
          curveType: 'monotone',
        },
      },
      line: {
        style: {
          lineWidth: 2,
          curveType: 'monotone',
        },
      },
      point: { visible: false },
      background: { fill: 'transparent' },
      animation: true,
    },
    spec_model_line: {
      type: 'area',
      data: [{ id: 'lineData', values: modelLineValues }],
      xField: 'Time',
      yField: 'Count',
      seriesField: 'Model',
      stack: false,
      axes: [chartTimeAxis, chartValueAxis],
      legends: { visible: true, selectMode: 'single' },
      color: modelColor,
      title: {
        visible: true,
        text: tt('Call Trend'),
      },
      tooltip: {
        mark: {
          content: [
            {
              key: (datum: Record<string, unknown>) => datum?.Model,
              value: (datum: Record<string, unknown>) =>
                formatInt(Number(datum?.Count) || 0),
            },
          ],
        },
        dimension: {
          content: [
            {
              key: (datum: Record<string, unknown>) => datum?.Model,
              value: (datum: Record<string, unknown>) =>
                Number(datum?.Count) || 0,
            },
          ],
          updateContent: (
            array: Array<{
              key: string
              value: string | number
            }>
          ) => {
            const modelItems = array.filter(
              (item) => !isOtherTooltipKey(item.key)
            )
            const otherItems = array.filter((item) =>
              isOtherTooltipKey(item.key)
            )
            modelItems.sort(
              (a, b) => (Number(b.value) || 0) - (Number(a.value) || 0)
            )
            array = [...modelItems, ...otherItems]

            let sum = 0
            for (let i = 0; i < array.length; i++) {
              const v = Number(array[i].value) || 0
              sum += v
              array[i].value = formatInt(v)
            }
            array.unshift({
              key: `${tt('Total')}:`,
              value: formatInt(sum),
            })
            return array
          },
        },
      },
      area: {
        style: {
          fillOpacity: 0.08,
          curveType: 'monotone',
        },
      },
      line: {
        style: {
          lineWidth: 2,
          curveType: 'monotone',
        },
      },
      point: { visible: false },
      background: { fill: 'transparent' },
      animation: true,
    },
    spec_rank_bar: {
      type: 'bar',
      data: [{ id: 'rankData', values: rankValues }],
      xField: 'Model',
      yField: 'Count',
      seriesField: 'Model',
      legends: { visible: true, selectMode: 'single' },
      color: modelColor,
      title: {
        visible: true,
        text: tt('Call Count Ranking'),
      },
      bar: {
        state: {
          hover: { stroke: '#000', lineWidth: 1 },
        },
      },
      tooltip: {
        mark: {
          content: [
            {
              key: (datum: Record<string, unknown>) => datum?.Model,
              value: (datum: Record<string, unknown>) =>
                formatInt(Number(datum?.Count) || 0),
            },
          ],
        },
      },
      background: { fill: 'transparent' },
      animation: true,
    },
    totalQuotaDisplay: formatQuotaTotal(totalQuotaRaw),
    totalCountDisplay: formatInt(totalTimes),
  }
}

