import { useState, useEffect, useCallback } from 'react'

import { handleServerError } from '@/lib/handle-server-error'

import { getTopupInfo } from '../api'
import type { WalletTopupInfo } from '../types'

// ============================================================================
// Topup Info Hook
// ============================================================================

/**
 * Reads the two topup flags the redemption card needs: whether redemption is
 * enabled, and where users can buy codes.
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
