import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, CircleAlert, CircleX } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { UserPortalHeading, UserPortalPage } from '@/components/layout'
import { api } from '@/lib/api'

type PublicChannelStatus = {
  id: number
  name: string
  type: number
  status: number
  test_time: number
  response_time: number
}

function statusIcon(status: number) {
  if (status === 1) return <CheckCircle2 className='size-4 text-emerald-600' aria-hidden='true' />
  if (status === 2) return <CircleAlert className='size-4 text-amber-600' aria-hidden='true' />
  return <CircleX className='size-4 text-rose-600' aria-hidden='true' />
}

export const Route = createFileRoute('/_authenticated/channel-status')({
  component: ChannelStatusPage,
})

function ChannelStatusPage() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ['public-channel-status'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: PublicChannelStatus[] }>('/api/channel-status')
      return response.data.data
    },
  })

  return (
    <UserPortalPage>
      <UserPortalHeading title={t('Channel status')} />
      <div className='overflow-x-auto rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface)]'>
        <table className='w-full min-w-[640px] text-left text-sm'>
          <thead className='border-b border-[var(--portal-border)] text-xs text-[var(--portal-muted)]'>
            <tr>
              <th className='px-5 py-3 font-medium'>{t('Provider')}</th>
              <th className='px-5 py-3 font-medium'>{t('Status')}</th>
              <th className='px-5 py-3 font-medium'>{t('Response time')}</th>
              <th className='px-5 py-3 font-medium'>{t('Last check')}</th>
            </tr>
          </thead>
          <tbody>
            {query.data?.map((channel) => (
              <tr key={channel.id} className='border-b border-[var(--portal-border)] last:border-0'>
                <td className='px-5 py-4 font-medium'>{channel.name}</td>
                <td className='px-5 py-4'><span className='inline-flex items-center gap-2'>{statusIcon(channel.status)}{channel.status === 1 ? t('Operational') : t('Unavailable')}</span></td>
                <td className='px-5 py-4 tabular-nums'>{channel.response_time > 0 ? `${channel.response_time} ms` : '—'}</td>
                <td className='px-5 py-4 tabular-nums'>{channel.test_time > 0 ? new Date(channel.test_time * 1000).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!query.isLoading && (query.data?.length ?? 0) === 0 ? <p className='p-6 text-sm text-[var(--portal-muted)]'>{t('No channel status data')}</p> : null}
      </div>
    </UserPortalPage>
  )
}
