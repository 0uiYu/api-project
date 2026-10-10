import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { usageLogSchema } from '../../data/schema'
import { useCommonLogsColumns } from '../columns/common-logs-columns'
import { DetailsDialog } from '../dialogs/details-dialog'
import { UsageLogsProvider, useUsageLogsContext } from '../usage-logs-provider'

function columnIds(isAdmin: boolean): string[] {
  let ids: string[] = []

  function Probe() {
    const columns = useCommonLogsColumns(isAdmin, false)
    const table = useReactTable({
      data: [],
      columns: columns as ColumnDef<Record<string, unknown>>[],
      getCoreRowModel: getCoreRowModel(),
    })
    ids = table.getAllColumns().map((column) => column.id)
    return null
  }

  render(<Probe />)
  return ids
}

function AffinityTargetProbe() {
  const { affinityTarget, affinityDialogOpen } = useUsageLogsContext()
  return (
    <span data-testid='affinity-state'>
      {affinityDialogOpen ? 'open' : 'closed'}:{affinityTarget?.rule_name ?? ''}
    </span>
  )
}

const affinityLog = usageLogSchema.parse({
  id: 1,
  user_id: 2,
  created_at: 1788840000,
  type: 2,
  content: '',
  model_name: 'gpt-5',
  username: 'alice',
  channel: 12,
  channel_name: 'primary',
  quota: 100,
  other: JSON.stringify({
    admin_info: {
      channel_affinity: {
        rule_name: 'sticky-a',
        using_group: 'default',
        key_hint: 'abcd',
        key_fp: 'fp-1',
      },
    },
  }),
})

describe('admin-only usage log affordances', () => {
  it('adds the IP column for admins only', () => {
    expect(columnIds(true)).toContain('ip')
    expect(columnIds(false)).not.toContain('ip')
  })

  it('opens the channel affinity dialog from the record details', async () => {
    const user = userEvent.setup()
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={client}>
        <UsageLogsProvider>
          <AffinityTargetProbe />
          <DetailsDialog
            log={affinityLog}
            isAdmin
            isRoot={false}
            open
            onOpenChange={vi.fn()}
          />
        </UsageLogsProvider>
      </QueryClientProvider>
    )

    expect(screen.getByTestId('affinity-state')).toHaveTextContent('closed:')
    await user.click(screen.getByRole('button', { name: /View/ }))
    expect(screen.getByTestId('affinity-state')).toHaveTextContent(
      'open:sticky-a'
    )
  })
})
