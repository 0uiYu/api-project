import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'

import { formatNumber } from '@/lib/format'
import { toIntlLocale } from '@/i18n/languages'

type Props = {
  channels: Array<{ channel_name: string; requests: number; failed_requests: number; success_rate: number; average_latency_seconds: number }>
  statuses: Array<{ status: string; count: number }>
  redemptions: { total: number; enabled: number; used: number }
}

type TaskUsage = {
  total: number
  running: number
  succeeded: number
  failed: number
  stuck: number
}

/**
 * Generation task health (video, music, image). Stuck counts tasks past the
 * system timeout that the sweeper has not settled yet, so a non-zero value is
 * always actionable.
 */
export function TaskHealthPanel(props: { tasks: TaskUsage }) {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const settled = props.tasks.succeeded + props.tasks.failed
  const failureRate =
    settled > 0 ? `${((props.tasks.failed / settled) * 100).toFixed(1)}%` : '—'
  const stats = [
    { label: t('Running'), value: props.tasks.running },
    { label: t('Success'), value: props.tasks.succeeded },
    { label: t('Failed'), value: props.tasks.failed },
    { label: t('Stuck'), value: props.tasks.stuck },
  ]

  return (
    <div className='rounded-xl border p-4'>
      <div className='flex items-center justify-between gap-3'>
        <h3 className='font-semibold'>{t('Task health')}</h3>
        <span className='text-muted-foreground text-xs'>
          {t('Generation tasks')}
        </span>
      </div>
      {props.tasks.stuck > 0 && (
        <div className='mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600'>
          <AlertTriangle className='size-3.5' aria-hidden='true' />
          {t('Tasks past their timeout need attention')}
        </div>
      )}
      <div className='mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4'>
        {stats.map((stat) => (
          <div key={stat.label} className='bg-muted/40 rounded p-2 text-center'>
            <div className='text-muted-foreground'>{stat.label}</div>
            <div className='mt-1 font-mono text-lg'>
              {formatNumber(stat.value, locale)}
            </div>
          </div>
        ))}
      </div>
      <div className='text-muted-foreground mt-3 flex justify-between text-xs'>
        <span>
          {t('Total')}: {formatNumber(props.tasks.total, locale)}
        </span>
        <span>
          {t('Failure rate')}: {failureRate}
        </span>
      </div>
    </div>
  )
}

export function OperationsAuxiliaryPanels(props: Props) {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  return <div className='mt-4 grid gap-4 lg:grid-cols-3'>
    <div className='rounded-lg border p-4'><h3 className='font-semibold'>{t('Channel performance')}</h3><div className='mt-3 space-y-2'>{props.channels.length ? props.channels.slice(0, 6).map((channel) => <div key={channel.channel_name} className='rounded bg-muted/40 p-2 text-xs'><div className='flex justify-between'><span className='truncate'>{channel.channel_name}</span><span className={channel.success_rate >= 0.99 ? 'text-emerald-600' : 'text-amber-600'}>{(channel.success_rate * 100).toFixed(1)}%</span></div><div className='text-muted-foreground mt-1 flex justify-between'><span>{t('Requests')}: {formatNumber(channel.requests, locale)}</span><span>{channel.average_latency_seconds.toFixed(2)}s</span></div></div>) : <div className='text-muted-foreground text-sm'>{t('No data')}</div>}</div></div>
    <div className='rounded-lg border p-4'><h3 className='font-semibold'>{t('HTTP error status ranking')}</h3><div className='mt-3 space-y-2'>{props.statuses.length ? props.statuses.slice(0, 6).map((item) => <div key={item.status} className='flex items-center justify-between rounded bg-red-500/5 px-3 py-2 text-xs'><span>{item.status === 'unknown' ? t('Unknown') : item.status}</span><span className='font-mono text-red-600'>{formatNumber(item.count, locale)}</span></div>) : <div className='text-muted-foreground text-sm'>{t('No data')}</div>}</div></div>
    <div className='rounded-lg border p-4'><h3 className='font-semibold'>{t('Redemption overview')}</h3><div className='mt-3 grid grid-cols-3 gap-2 text-center text-xs'><div><div className='text-muted-foreground'>{t('Total')}</div><div className='mt-1 font-mono text-lg'>{props.redemptions.total}</div></div><div><div className='text-muted-foreground'>{t('Available')}</div><div className='mt-1 font-mono text-lg text-emerald-600'>{props.redemptions.enabled}</div></div><div><div className='text-muted-foreground'>{t('Redeemed')}</div><div className='mt-1 font-mono text-lg text-sky-600'>{props.redemptions.used}</div></div></div></div>
  </div>
}
