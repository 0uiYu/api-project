import { useState, useEffect, useCallback } from 'react'

import { handleServerError } from '@/lib/handle-server-error'

import { getTopupInfo } from '../api'
import type { WalletTopupInfo } from '../types'

// ============================================================================
// Topup Info Hook
// ============================================================================

/**
 * Reads topup settings. The wallet page uses redemption and the purchase
 * link. The referral and subscription pages also read payment methods and
 * the compliance flag.
 */
export function useTopupInfo() {
  const [topupInfo, setTopupInfo] = useState<WalletTopupInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTopupInfo = useCallback(async () => {
    try {
      setLoading(true)

      const response = await getTopupInfo()

      if (!response.success || !response.data) {
        handleServerError(response)
        return
      }

      setTopupInfo({
        enable_redemption: response.data.enable_redemption,
        topup_link: response.data.topup_link,
        enable_online_topup: response.data.enable_online_topup,
        enable_stripe_topup: response.data.enable_stripe_topup,
        enable_creem_topup: response.data.enable_creem_topup,
        enable_waffo_pancake_topup: response.data.enable_waffo_pancake_topup,
        pay_methods: response.data.pay_methods,
        payment_compliance_confirmed:
          response.data.payment_compliance_confirmed,
      })
    } catch (err) {
      handleServerError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      if (!cancelled) void fetchTopupInfo()
    })

    return () => {
      cancelled = true
    }
  }, [fetchTopupInfo])

  return {
    topupInfo,
    loading,
    refetch: fetchTopupInfo,
  }
}
