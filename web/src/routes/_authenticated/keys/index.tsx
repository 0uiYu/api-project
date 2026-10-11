import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import z from 'zod'

import { ApiKeys } from '@/features/keys'
import { API_KEY_STATUS_OPTIONS } from '@/features/keys/constants'

const apiKeySearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(undefined),
  status: z
    .array(z.enum(API_KEY_STATUS_OPTIONS.map((s) => s.value as `${number}`)))
    .optional()
    .catch([]),
  filter: z.string().optional().catch(''),
  token: z.string().optional().catch(''),
  create: z.literal(1).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/keys/')({
  validateSearch: apiKeySearchSchema,
  component: ApiKeysRoute,
})

function ApiKeysRoute() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const handleCreateRequest = useCallback(() => {
    void navigate({
      to: '/keys',
      search: {
        page: search.page,
        pageSize: search.pageSize,
        status: search.status,
        filter: search.filter,
        token: search.token,
      },
      replace: true,
    })
  }, [navigate, search])

  return (
    <ApiKeys
      openCreate={search.create === 1}
      onCreateRequestHandled={handleCreateRequest}
    />
  )
}
