import { api } from '@/lib/api'

import type { AdminUsageSummary, QuotaDataItem } from './types'

// ============================================================================
// Dashboard APIs
// ============================================================================

// ----------------------------------------------------------------------------
// Quota & Usage Data
// ----------------------------------------------------------------------------

// Get user quota data within a time range
// Admin users get all users' data by default.
export async function getUserQuotaDates(
  params: {
    start_timestamp: number
    end_timestamp: number
    default_time?: string
    username?: string
  },
  isAdmin = false
) {
  const endpoint = isAdmin ? '/api/data' : '/api/data/self'
  const res = await api.get<{ success: boolean; data: QuotaDataItem[] }>(
    endpoint,
    { params }
  )
  return res.data
}

// Admin totals for an explicit window. The operations overview and the model
// analysis cards must count the same settled log rows, so both read this
// endpoint instead of deriving their own totals from different tables.
export async function getAdminUsageSummary(params: {
  start_timestamp: number
  end_timestamp: number
}) {
  const res = await api.get<{ success: boolean; data: AdminUsageSummary }>(
    '/api/admin/analytics/usage-summary',
    { params }
  )
  return res.data
}

