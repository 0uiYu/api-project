import { api } from '@/lib/api'

import type {
  AffiliateCodeResponse,
  AffiliateTransferRequest,
  AffiliateTransferResponse,
  BillingHistoryResponse,
  RedemptionRequest,
  RedemptionResponse,
  TopupInfoResponse,
} from './types'

// ============================================================================
// Wallet API Functions
// ============================================================================

/**
 * Get topup configuration info
 */
export async function getTopupInfo(): Promise<TopupInfoResponse> {
  const res = await api.get('/api/user/topup/info')
  return res.data
}

/**
 * Redeem a topup code
 */
export async function redeemTopupCode(
  request: RedemptionRequest
): Promise<RedemptionResponse> {
  const res = await api.post('/api/user/topup', request)
  return res.data
}

/**
 * Get topup history for the current user
 */
export async function getAffiliateCode(): Promise<AffiliateCodeResponse> {
  const res = await api.get('/api/user/aff')
  return res.data
}

export async function transferAffiliateQuota(
  request: AffiliateTransferRequest
): Promise<AffiliateTransferResponse> {
  const res = await api.post('/api/user/aff_transfer', request)
  return res.data
}

export async function getUserBillingHistory(
  page: number,
  pageSize: number
): Promise<BillingHistoryResponse> {
  const params = new URLSearchParams({
    p: page.toString(),
    page_size: pageSize.toString(),
  })
  const res = await api.get(`/api/user/topup/self?${params.toString()}`)
  return res.data
}
