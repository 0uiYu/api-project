import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Main } from '@/components/layout'
import { getSelf } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'

import { SubscriptionPlansCard } from './components/subscription-plans-card'
import { useTopupInfo } from './hooks'
import type { UserWalletData } from './types'

export function SubscriptionPlansPage() {
  const { t } = useTranslation()
  const { topupInfo } = useTopupInfo()
  const [quota, setQuota] = useState<number | undefined>(undefined)

  const fetchUser = useCallback(async () => {
    try {
      const response = await getSelf()
      if (response.success && response.data) {
        const wallet = response.data as UserWalletData
        setQuota(Number(wallet.quota ?? 0))
      }
    } catch (error) {
      handleServerError(error)
    }
  }, [])

  useEffect(() => {
    void fetchUser()
  }, [fetchUser])

  return (
    <Main>
      <div className='min-h-0 flex-1 overflow-auto'>
        <div className='mx-auto w-full max-w-7xl px-3 py-6 sm:px-4 sm:py-8'>
          <h1 className='text-foreground text-lg font-semibold tracking-tight sm:text-xl'>
            {t('Subscription Plans')}
          </h1>
          <p
            data-slot='subscription-notice'
            className='mt-4 rounded-xl border border-[#D7E4F7] bg-[#F4F8FC] px-4 py-3 text-sm leading-6 text-[#17243D]'
          >
            {t('To subscribe, contact an administrator.')}
          </p>
          <div className='mt-4'>
            <SubscriptionPlansCard
              topupInfo={topupInfo}
              userQuota={quota}
              onPurchaseSuccess={fetchUser}
            />
          </div>
        </div>
      </div>
    </Main>
  )
}
