// ============================================================================
// Wallet Type Definitions
// ============================================================================

/**
 * Generic API response
 */
export interface ApiResponse<T = unknown> {
  success?: boolean
  message?: string
  data?: T
}

/**
 * Topup configuration the redemption flow depends on. The backend returns
 * more payment fields; only these two are read here.
 */
export interface WalletTopupInfo {
  /** Whether redemption code usage is enabled */
  enable_redemption?: boolean
  /** Optional link for purchasing redemption codes */
  topup_link?: string
}

export type TopupInfoResponse = ApiResponse<WalletTopupInfo>
export type RedemptionResponse = ApiResponse<number>

/**
 * Topup record status
 */
export type TopupStatus = 'success' | 'pending' | 'expired'

/**
 * Topup billing record
 */
export interface TopupRecord {
  /** Record ID */
  id: number
  /** User ID */
  user_id: number
  /** Topup amount (quota) */
  amount: number
  /** Payment amount (actual money paid) */
  money: number
  /** Trade/order number */
  trade_no: string
  /** Payment method type */
  payment_method: string
  /** Creation timestamp */
  create_time: number
  /** Completion timestamp */
  complete_time?: number
  /** Payment status */
  status: TopupStatus
}

/**
 * Billing history response
 */
export type BillingHistoryResponse = ApiResponse<{
  items: TopupRecord[]
  total: number
}>

/**
 * Creem product configuration. Kept in this feature because the Creem
 * settings editor imports the type from here.
 */
export interface CreemProduct {
  /** Product display name */
  name: string
  /** Creem product ID */
  productId: string
  /** Product price */
  price: number
  /** Quota amount to credit */
  quota: number
  /** Currency (USD or EUR) */
  currency: 'USD' | 'EUR'
}

/**
 * Redemption code request
 */
export interface RedemptionRequest {
  /** Redemption code key */
  key: string
}

/**
 * User wallet data
 */
export interface UserWalletData {
  /** User ID */
  id: number
  /** Username */
  username: string
  /** Current quota balance */
  quota: number
  /** User group */
  group: string
}
