import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { KeyRound, Power } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { DataTablePage, useDataTable } from '@/components/data-table'
import { SectionPageLayout } from '@/components/layout'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import { formatQuota, formatTimestampToDate } from '@/lib/format'
import { createServerError } from '@/lib/server-error-message'

import { getAdminTokens, updateAdminTokenStatus } from './api'
import type { AdminToken } from './types'

const route = getRouteApi('/_authenticated/admin-tokens/')

export function AdminTokens() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = route.useNavigate()
  const search = route.useSearch()
  const state = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 20 },
    globalFilter: { enabled: true, key: 'filter' },
  })

  const query = useQuery({
    queryKey: [
      'admin-tokens',
      state.pagination.pageIndex,
      state.pagination.pageSize,
      state.globalFilter,
    ],
    queryFn: async () => {
      const response = await getAdminTokens({
        p: state.pagination.pageIndex + 1,
        size: state.pagination.pageSize,
        keyword: state.globalFilter,
      })
      if (!response.success) {
        throw createServerError(response, t('Failed to load API keys'))
      }
      return response.data
    },
    placeholderData: (previous) => previous,
  })

  const statusMutation = useMutation({
    mutationFn: (token: AdminToken) =>
      updateAdminTokenStatus(token.id, token.status === 1 ? 2 : 1),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-tokens'] })
    },
  })

  const columns = useMemo<ColumnDef<AdminToken>[]>(
    () => [
      { accessorKey: 'id', header: t('ID'), size: 70 },
      { accessorKey: 'user_id', header: t('User ID'), size: 90 },
      { accessorKey: 'name', header: t('Name'), size: 180 },
      {
        accessorKey: 'key',
        header: t('API Key'),
        cell: ({ row }) => (
          <code className='font-mono'>{row.original.key}</code>
        ),
      },
      { accessorKey: 'group', header: t('Group'), size: 120 },
      {
        accessorKey: 'status',
        header: t('Status'),
        cell: ({ row }) => (
          <StatusBadge
            label={row.original.status === 1 ? t('Enabled') : t('Disabled')}
            variant={row.original.status === 1 ? 'success' : 'grey'}
            copyable={false}
          />
        ),
      },
      {
        accessorKey: 'remain_quota',
        header: t('Remaining quota'),
        cell: ({ row }) =>
          row.original.unlimited_quota
            ? t('Unlimited')
            : formatQuota(row.original.remain_quota),
      },
      {
        accessorKey: 'used_quota',
        header: t('Used quota'),
        cell: ({ row }) => formatQuota(row.original.used_quota),
      },
      {
        accessorKey: 'accessed_time',
        header: t('Last Used'),
        cell: ({ row }) => formatTimestampToDate(row.original.accessed_time),
      },
      {
        accessorKey: 'expired_time',
        header: t('Expires'),
        cell: ({ row }) =>
          row.original.expired_time < 0
            ? t('Never')
            : formatTimestampToDate(row.original.expired_time),
      },
      {
        accessorKey: 'cross_group_retry',
        header: t('Cross-group retry'),
        cell: ({ row }) =>
          row.original.cross_group_retry ? t('Enabled') : t('Disabled'),
      },
      {
        id: 'actions',
        header: t('Actions'),
        enableHiding: false,
        cell: ({ row }) => (
          <Button
            variant='ghost'
            size='sm'
            disabled={statusMutation.isPending}
            onClick={() => statusMutation.mutate(row.original)}
          >
            <Power className='size-4' />
            {row.original.status === 1 ? t('Disable') : t('Enable')}
          </Button>
        ),
      },
    ],
    [statusMutation, t]
  )

  const { table } = useDataTable({
    data: query.data?.items ?? [],
    columns,
    totalCount: query.data?.total ?? 0,
    getRowId: (row) => String(row.id),
    ...state,
    columnFilters: [],
    manualPagination: true,
    manualFiltering: true,
    enableRowSelection: false,
  })

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        {t('API Key Management')}
      </SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <DataTablePage
          table={table}
          columns={columns}
          isLoading={query.isLoading}
          isFetching={query.isFetching}
          emptyTitle={t('No API keys found')}
          emptyIcon={<KeyRound className='size-6' />}
          applyHeaderSize
          toolbarProps={{
            searchPlaceholder: t('Search API keys or users...'),
            searchDebounceMs: 300,
          }}
        />
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
