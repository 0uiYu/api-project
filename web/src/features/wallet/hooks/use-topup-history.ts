import i18next from 'i18next'
import { useCallback, useEffect, useState } from 'react'

import { handleServerError } from '@/lib/handle-server-error'

import { getUserBillingHistory } from '../api'
import { TOPUP_HISTORY_PAGE_SIZE } from '../constants'
import type { TopupRecord } from '../types'

// ============================================================================
// Topup History Hook
// ============================================================================

/**
 * Paginated topup history for the signed-in user.
 */
export function useTopupHistory() {
  const [records, setRecords] = useState<TopupRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getUserBillingHistory(
        page,
        TOPUP_HISTORY_PAGE_SIZE
      )

      if (response.success && response.data) {
        setRecords(response.data.items ?? [])
        setTotal(response.data.total ?? 0)
      } else {
        handleServerError(response, i18next.t('Failed to load billing history'))
        setRecords([])
        setTotal(0)
      }
    } catch (error) {
      handleServerError(error, i18next.t('Failed to load billing history'))
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory])

  return {
    records,
    total,
    page,
    pageSize: TOPUP_HISTORY_PAGE_SIZE,
    loading,
    setPage,
  }
}
