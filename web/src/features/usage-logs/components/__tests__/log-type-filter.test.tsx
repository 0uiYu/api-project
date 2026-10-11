import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

import { CommonLogsFilterBar } from '../common-logs-filter-bar'
import { UsageLogsProvider } from '../usage-logs-provider'

function FilterFixture() {
  const table = useReactTable({
    data: [],
    columns: [],
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <UsageLogsProvider>
      <CommonLogsFilterBar table={table} />
    </UsageLogsProvider>
  )
}

async function renderFilter(role = 10, initialEntry = '/usage-logs/common') {
  useAuthStore.getState().auth.setUser({ id: 1, username: 'viewer', role })
  vi.spyOn(api, 'get').mockImplementation(async (url) => {
    let data: unknown = { quota: 0, rpm: 0, tpm: 0 }
    if (url === '/api/group/') data = []
    if (url === '/api/user/self/groups') data = {}
    return { data: { success: true, data } }
  })
  const root = createRootRoute()
  const auth = createRoute({ getParentRoute: () => root, id: '_authenticated' })
  const logs = createRoute({
    getParentRoute: () => auth,
    path: '/usage-logs/$section',
    component: FilterFixture,
    validateSearch: (search: Record<string, unknown>) => search,
  })
  const router = createRouter({
    routeTree: root.addChildren([auth.addChildren([logs])]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
  await screen.findByRole('combobox', { name: 'Type' })
  return router
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  useAuthStore.getState().auth.setUser(null)
})

it('marks only retired log types as deprecated while keeping historical filters selectable', async () => {
  const router = await renderFilter()
  await userEvent.click(screen.getByRole('combobox', { name: 'Type' }))
  for (const label of ['Manage', 'Login']) {
    expect(
      within(
        screen.getByRole('option', { name: new RegExp(`^${label}`) })
      ).getByText('Deprecated')
    ).toBeVisible()
  }
  for (const label of [
    'All Types',
    'Top-up',
    'Consume',
    'System',
    'Error',
    'Refund',
  ]) {
    expect(
      within(screen.getByRole('option', { name: label })).queryByText(
        'Deprecated'
      )
    ).not.toBeInTheDocument()
  }
  await userEvent.click(screen.getByRole('option', { name: /^Manage/ }))
  expect(screen.getByRole('combobox', { name: 'Type' })).toHaveTextContent(
    'Deprecated'
  )
  await userEvent.click(screen.getByRole('button', { name: 'Search' }))
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({ type: ['3'], page: 1 })
  )
  await userEvent.click(screen.getByRole('combobox', { name: 'Type' }))
  await userEvent.click(screen.getByRole('option', { name: /^Login/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Search' }))
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({ type: ['7'], page: 1 })
  )
})

it('shows a regular user the time range, model, and four results', async () => {
  await renderFilter(1)
  expect(screen.getByPlaceholderText('Model Name')).toBeVisible()
  expect(screen.getByRole('combobox', { name: 'Type' })).toHaveTextContent(
    'All'
  )
  expect(
    screen.queryByRole('combobox', { name: 'Group' })
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Expand' })
  ).not.toBeInTheDocument()
  expect(screen.queryByPlaceholderText('Token Name')).not.toBeInTheDocument()
  expect(screen.queryByPlaceholderText('Request ID')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('combobox', { name: 'Type' }))
  for (const label of ['All', 'Consume', 'Error', 'Refund']) {
    expect(screen.getByRole('option', { name: label })).toBeVisible()
  }
  for (const label of ['Top-up', 'Manage', 'System', 'Login']) {
    expect(
      screen.queryByRole('option', { name: new RegExp(label) })
    ).not.toBeInTheDocument()
  }
})

it('lets a regular user search errors and drops a hidden group filter', async () => {
  const router = await renderFilter(
    1,
    '/usage-logs/common?group=premium&type=%5B%223%22%5D'
  )
  expect(screen.getByRole('combobox', { name: 'Type' })).toHaveTextContent(
    'All'
  )
  await userEvent.click(screen.getByRole('combobox', { name: 'Type' }))
  await userEvent.click(screen.getByRole('option', { name: 'Error' }))
  await userEvent.click(screen.getByRole('button', { name: 'Search' }))
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({
      type: ['5'],
      page: 1,
    })
  )
  expect(router.state.location.search).not.toHaveProperty('group')
})
