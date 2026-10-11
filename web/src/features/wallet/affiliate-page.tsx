import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Main } from '@/components/layout'
import { getSelf } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'

import { AffiliateRewardsCard } from './components/affiliate-rewards-card'
import { TransferDialog } from './components/dialogs/transfer-dialog'
import { useAffiliate, useTopupInfo } from './hooks'
import type { UserWalletData } from './types'

export function AffiliatePage() {
  const { t } = useTranslation()
  const [user, setUser] = useState<UserWalletData | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const { topupInfo } = useTopupInfo()
  const { affiliateLink, loading, transferQuota, transferring } = useAffiliate()

  const fetchUser = useCallback(async () => {
    try {
      const response = await getSelf()
      if (response.success && response.data) {
        setUser(response.data as UserWalletData)
      }
    } catch (error) {
      handleServerError(error)
    }
  }, [])

  useEffect(() => {
    void fetchUser()
  }, [fetchUser])

  const handleTransfer = async (amount: number) => {
    const success = await transferQuota(amount)
    if (success) {
      await fetchUser()
    }
    return success
  }

  return (
    <>
      <Main>
        <div className='min-h-0 flex-1 overflow-auto'>
          <div className='mx-auto w-full max-w-5xl px-3 py-6 sm:px-4 sm:py-8'>
            <h1 className='text-foreground text-lg font-semibold tracking-tight sm:text-xl'>
              {t('Referral Program')}
            </h1>
            <div className='mt-4'>
              <AffiliateRewardsCard
                user={user}
                affiliateLink={affiliateLink}
                onTransfer={() => setTransferOpen(true)}
                complianceConfirmed={
                  topupInfo?.payment_compliance_confirmed !== false
                }
                loading={loading}
              />
            </div>
          </div>
        </div>
      </Main>
      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        onConfirm={handleTransfer}
        availableQuota={user?.aff_quota ?? 0}
        transferring={transferring}
      />
    </>
  )
}
