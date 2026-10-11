import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Main } from '@/components/layout'
import { getSelf } from '@/lib/api'

import { WalletBalanceCard } from './components/balance-card'
import { RedeemCodeCard } from './components/redeem-code-card'
import { TopupHistoryDialog } from './components/topup-history-dialog'
import { DEFAULT_PURCHASE_URL } from './constants'
import { useRedemption, useTopupInfo } from './hooks'
import type { UserWalletData } from './types'

/**
 * Wallet: current balance, a link to buy quota, redemption code topup and the
 * topup history dialog. Referral rewards and subscription purchase live on
 * their own console pages. Online quota payment stays off this page.
 */
export function Wallet() {
  const { t } = useTranslation()
  const [user, setUser] = useState<UserWalletData | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [redemptionCode, setRedemptionCode] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)

  const { redeeming, redeemCode } = useRedemption()
  const { topupInfo } = useTopupInfo()

  const fetchUser = useCallback(async () => {
    try {
      setUserLoading(true)
      const response = await getSelf()
      if (response.success && response.data) {
        setUser(response.data as UserWalletData)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch user data:', error)
    } finally {
      setUserLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUser()
  }, [fetchUser])

  const handleRedeem = async () => {
    const success = await redeemCode(redemptionCode)
    if (!success) return

    setRedemptionCode('')
    await fetchUser()
  }

  return (
    <>
      <Main>
        <div className='min-h-0 flex-1 overflow-auto'>
          <div className='mx-auto w-full max-w-3xl px-3 py-6 sm:px-4 sm:py-8'>
            <h1 className='text-foreground text-lg font-semibold tracking-tight sm:text-xl'>
              {t('Account Balance')}
            </h1>

            <div className='mt-4 flex flex-col gap-4'>
              <WalletBalanceCard
                quota={Number(user?.quota ?? 0)}
                loading={userLoading}
                purchaseUrl={topupInfo?.topup_link || DEFAULT_PURCHASE_URL}
                onOpenHistory={() => setHistoryOpen(true)}
              />
              <RedeemCodeCard
                code={redemptionCode}
                onCodeChange={setRedemptionCode}
                onRedeem={handleRedeem}
                redeeming={redeeming}
                enabled={topupInfo?.enable_redemption !== false}
                topupLink={topupInfo?.topup_link}
              />
            </div>
          </div>
        </div>
      </Main>

      <TopupHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
    </>
  )
}
