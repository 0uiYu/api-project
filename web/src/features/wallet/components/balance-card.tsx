import { ArrowUpRight, History, WalletCards } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatQuota } from '@/lib/format'

interface WalletBalanceCardProps {
  quota: number
  loading?: boolean
  /** Where the "Buy quota" button points. */
  purchaseUrl: string
  onOpenHistory: () => void
}

export function WalletBalanceCard(props: WalletBalanceCardProps) {
  const { t } = useTranslation()

  return (
    <div className='border-border bg-card/85 relative overflow-hidden rounded-2xl border p-5 shadow-[0_18px_38px_-30px_rgba(37,99,235,0.55),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md sm:p-6'>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-[radial-gradient(closest-side,rgba(96,165,250,0.28),rgba(96,165,250,0))]'
      />

      <div className='relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between'>
        <div className='min-w-0'>
          <span className='border-border bg-card/70 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] tracking-[0.14em] backdrop-blur-md'>
            <WalletCards className='size-3' aria-hidden='true' />
            {t('Current Balance')}
          </span>

          {props.loading ? (
            <Skeleton className='mt-3 h-9 w-36' />
          ) : (
            <div className='mt-3 truncate font-mono text-3xl font-semibold tracking-tight text-[#1E3A8A] tabular-nums sm:text-4xl dark:text-[#93C5FD]'>
              {formatQuota(props.quota)}
            </div>
          )}

          <p className='text-muted-foreground mt-1.5 text-xs'>
            {t('Available')}
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            className='h-11 rounded-lg bg-[#2563EB] px-6 text-white shadow-[0_18px_38px_-16px_rgba(37,99,235,0.65),0_2px_6px_-2px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.28)] hover:-translate-y-px hover:bg-[#1D4ED8]! hover:shadow-[0_22px_44px_-16px_rgba(37,99,235,0.7),0_2px_6px_-2px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.32)]'
            render={
              <a
                href={props.purchaseUrl}
                target='_blank'
                rel='noopener noreferrer'
              />
            }
          >
            {t('Buy quota')}
            <ArrowUpRight data-icon='inline-end' aria-hidden='true' />
          </Button>
          <Button
            variant='outline'
            className='border-border bg-card/70 text-foreground hover:bg-muted hover:text-foreground h-11 rounded-lg border px-6'
            onClick={props.onOpenHistory}
          >
            <History data-icon='inline-start' aria-hidden='true' />
            {t('Topup history')}
          </Button>
        </div>
      </div>
    </div>
  )
}
