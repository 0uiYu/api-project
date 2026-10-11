import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatQuota } from '@/lib/format'

import type { UserWalletData } from '../types'

interface AffiliateRewardsCardProps {
  user: UserWalletData | null
  affiliateLink: string
  onTransfer: () => void
  complianceConfirmed?: boolean
  loading?: boolean
}

const sheetClassName =
  'grid overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white text-[#17243D] shadow-[0_24px_50px_-36px_rgba(30,58,138,0.55)] lg:grid-cols-[minmax(16rem,0.85fr)_minmax(0,1.15fr)] [--accent-foreground:#17243D] [--accent:#F4F8FC] [--background:#ffffff] [--border:#E2E8F0] [--foreground:#17243D] [--input:#E2E8F0] [--muted-foreground:#64748B] [--muted:#F4F8FC] [--primary-foreground:#ffffff] [--primary:#2563EB]'

export function AffiliateRewardsCard(props: AffiliateRewardsCardProps) {
  const { t } = useTranslation()
  const complianceConfirmed = props.complianceConfirmed !== false

  if (props.loading) {
    return (
      <div
        data-slot='affiliate-sheet'
        aria-busy='true'
        className={sheetClassName}
      >
        <div className='bg-[#1E3A8A] px-6 py-7 sm:px-8'>
          <Skeleton className='h-16 w-full bg-white/15' />
          <Skeleton className='mt-8 h-8 w-36 bg-white/25' />
        </div>
        <div className='flex flex-col gap-6 bg-white px-6 py-7 sm:px-8'>
          <Skeleton className='h-16 w-48' />
          <Skeleton className='h-12 w-full' />
        </div>
      </div>
    )
  }

  const hasRewards = (props.user?.aff_quota ?? 0) > 0

  return (
    <div data-slot='affiliate-sheet' className={sheetClassName}>
      <section
        data-slot='affiliate-link'
        className='flex flex-col justify-between gap-8 bg-[#1E3A8A] px-6 py-7 text-white sm:px-8'
      >
        <p className='max-w-sm text-sm leading-6 text-white/75'>
          {t(
            'Earn rewards when users join through your referral link. Transfer accumulated rewards to your balance anytime.'
          )}
        </p>
        <div>
          {props.affiliateLink ? (
            <p className='font-mono text-xs leading-5 break-all text-white/70'>
              {props.affiliateLink}
            </p>
          ) : null}
          {props.affiliateLink ? (
            <CopyButton
              value={props.affiliateLink}
              variant='outline'
              size='default'
              className='mt-4 border-white/30 bg-white text-[#1E3A8A] hover:bg-white hover:text-[#1E3A8A] dark:border-white/30 dark:bg-white dark:text-[#1E3A8A] dark:hover:bg-white'
              tooltip={t('Copy referral link')}
              aria-label={t('Copy referral link')}
            >
              {t('Copy referral link')}
            </CopyButton>
          ) : null}
        </div>
      </section>

      <section
        data-slot='affiliate-figures'
        className='flex min-w-0 flex-col bg-white'
      >
        <div className='flex flex-1 flex-col justify-between gap-8 px-6 py-7 sm:px-8'>
          <div>
            <p className='text-sm text-[#64748B]'>{t('Pending')}</p>
            <p className='mt-2 font-mono text-4xl font-semibold tracking-tight text-[#1E3A8A] tabular-nums'>
              {formatQuota(props.user?.aff_quota ?? 0)}
            </p>
            {hasRewards ? (
              <Button
                onClick={props.onTransfer}
                disabled={!complianceConfirmed}
                className='mt-5'
              >
                {t('Transfer to Balance')}
              </Button>
            ) : null}
          </div>
          <div className='grid grid-cols-2 border-t border-[#E7EEF6] pt-5'>
            <div>
              <p className='text-sm text-[#64748B]'>{t('Total Earned')}</p>
              <p className='mt-1 font-mono text-lg font-semibold tabular-nums'>
                {formatQuota(props.user?.aff_history_quota ?? 0)}
              </p>
            </div>
            <div className='border-l border-[#E7EEF6] pl-5'>
              <p className='text-sm text-[#64748B]'>{t('Invites')}</p>
              <p className='mt-1 font-mono text-lg font-semibold tabular-nums'>
                {props.user?.aff_count ?? 0}
              </p>
            </div>
          </div>
        </div>
        {!complianceConfirmed ? (
          <p className='border-t border-[#E7EEF6] bg-[#F4F8FC] px-6 py-3 text-sm text-[#64748B] sm:px-8'>
            {t(
              'Referral reward transfer is disabled until the administrator confirms compliance terms.'
            )}
          </p>
        ) : null}
      </section>
    </div>
  )
}
