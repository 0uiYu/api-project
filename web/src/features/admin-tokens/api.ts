import { api } from '@/lib/api'

import type { AdminTokensResponse } from './types'

export async function getAdminTokens(params: {
  p: number
  size: number
  keyword?: string
  user_id?: number
}): Promise<AdminTokensResponse> {
  const query = new URLSearchParams({
    p: String(params.p),
    size: String(params.size),
  })
  if (params.keyword) query.set('keyword', params.keyword)
  if (params.user_id && params.user_id > 0) {
    query.set('user_id', String(params.user_id))
  }
  const response = await api.get(`/api/admin/tokens/?${query.toString()}`)
  return response.data
}

export async function updateAdminTokenStatus(id: number, status: number) {
  const response = await api.patch(`/api/admin/tokens/${id}/status`, { status })
  return response.data as { success?: boolean; message?: string }
}
