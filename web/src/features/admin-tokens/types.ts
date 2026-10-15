export interface AdminToken {
  id: number
  user_id: number
  name: string
  key: string
  status: number
  remain_quota: number
  used_quota: number
  unlimited_quota: boolean
  expired_time: number
  created_time: number
  accessed_time: number
  group: string
  model_limits_enabled?: boolean
  model_limits?: string
  allow_ips?: string[] | string
  cross_group_retry?: boolean
}

export interface AdminTokensResponse {
  success: boolean
  message?: string
  data?: {
    items: AdminToken[]
    total: number
    page: number
    page_size: number
  }
}
