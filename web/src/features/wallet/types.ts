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
 * Payment method offered for subscription checkout.
 */
export interface PaymentMethod {
  name: string
  type: string
  color?: string
  min_topup?: number
  icon?: string
}

/**
 * Topup configuration read by the wallet, referral, and subscription pages.
 * The wallet page only uses redemption and the purchase link.
 */
export interface WalletTopupInfo {
  /** Whether redemption code usage is enabled */
  enable_redemption?: boolean
  /** Optional link for purchasing redemption codes */
  topup_link?: string
  enable_online_topup?: boolean
  enable_stripe_topup?: boolean
  enable_creem_topup?: boolean
  enable_waffo_pancake_topup?: boolean
  pay_methods?: PaymentMethod[]
  /** False blocks transferring referral rewards until an admin confirms terms */
  payment_compliance_confirmed?: boolean
}

/** Name used by the restored subscription plans card. */
export type TopupInfo = WalletTopupInfo

export type AffiliateCodeResponse = ApiResponse<string>
export type AffiliateTransferResponse = ApiResponse

export interface AffiliateTransferRequest {
  quota: number
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
  /** Referral rewards not yet transferred */
  aff_quota?: number
  /** Referral rewards ever earned */
  aff_history_quota?: number
  /** Number of invited users */
  aff_count?: number
}
