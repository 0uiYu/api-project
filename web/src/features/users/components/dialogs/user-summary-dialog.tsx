import { useQuery } from '@tanstack/react-query'
import { Activity, CreditCard, Gift, KeyRound, Ticket } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { formatNumber, formatQuota } from '@/lib/format'

type UserSummary = {
  token_count: number
  consume_log_count: number
  top_up_count: number
  top_up_quota: number
  redemption_count: number
  subscription_count: number
  invited_user_count: number
  has_inviter: boolean
}

export function UserSummaryDialog(props: {
  userId: number
  username: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ['admin-user-summary', props.userId],
    queryFn: async () => {
      const response = await api.get<{ data: UserSummary }>(
        `/api/user/${props.userId}/summary`
      )
      return response.data.data
    },
    enabled: props.open,
  })
  const summary = query.data
  const cards = [
    [KeyRound, t('API keys'), summary?.token_count ?? 0],
    [Activity, t('Call records'), summary?.consume_log_count ?? 0],
    [CreditCard, t('Top-up records'), summary?.top_up_count ?? 0],
    [Gift, t('Invited users'), summary?.invited_user_count ?? 0],
    [Ticket, t('Redemption records'), summary?.redemption_count ?? 0],
  ] as const

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('Account activity: {{username}}', { username: props.username })}
          </DialogTitle>
        </DialogHeader>
        {query.isLoading ? (
          <p className='text-muted-foreground text-sm'>{t('Loading...')}</p>
        ) : query.isError ? (
          <p className='text-destructive text-sm'>
            {t('Failed to load account activity')}
          </p>
        ) : (
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            {cards.map(([Icon, label, value]) => (
              <div key={label} className='rounded-md border p-3'>
                <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                  <Icon className='size-4' />
                  {label}
                </div>
                <div className='mt-2 text-lg font-semibold'>
                  {formatNumber(value)}
                </div>
              </div>
            ))}
            <div className='rounded-md border p-3'>
              <div className='text-muted-foreground text-xs'>
                {t('Top-up quota')}
              </div>
              <div className='mt-2 text-lg font-semibold'>
                {formatQuota(summary?.top_up_quota ?? 0)}
              </div>
            </div>
            <div className='rounded-md border p-3'>
              <div className='text-muted-foreground text-xs'>
                {t('Subscriptions')}
              </div>
              <div className='mt-2 text-lg font-semibold'>
                {formatNumber(summary?.subscription_count ?? 0)}
              </div>
            </div>
            <div className='rounded-md border p-3'>
              <div className='text-muted-foreground text-xs'>
                {t('Inviter relationship')}
              </div>
              <div className='mt-2 text-lg font-semibold'>
                {summary?.has_inviter ? t('Has inviter') : t('No inviter')}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
