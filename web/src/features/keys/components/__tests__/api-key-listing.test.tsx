import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  cleanup,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { Toaster, toast } from 'sonner'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import zh from '@/i18n/locales/zh.json'
import { api } from '@/lib/api'
import {
  DEFAULT_CURRENCY_CONFIG,
  useSystemConfigStore,
} from '@/stores/system-config-store'

import { apiKeySchema, type ApiKey } from '../../types'
import { ApiKeyQuotaCell } from '../api-key-quota-cell'
import { useApiKeysColumns } from '../api-keys-columns'
import { ApiKeysDialogs } from '../api-keys-dialogs'
import { ApiKeysProvider } from '../api-keys-provider'
import { ApiKeysTable } from '../api-keys-table'

const now = 1_700_000_000_000
const key = apiKeySchema.parse({
  id: 7,
  name: 'production',
  key: 'demo********1234',
  status: 1,
  remain_quota: 40_000_000,
  used_quota: 60_000_000,
  unlimited_quota: false,
  expired_time: -1,
  created_time: 0,
  accessed_time: 0,
  group: 'default',
  model_limits_enabled: false,
})
const i18n = createInstance()
await i18n.init({
  lng: 'en',
  resources: { en: { translation: {} } },
  initAsync: false,
})
const clients: QueryClient[] = []

function QuotaTable(props: { apiKey: ApiKey }) {
  const columns = useApiKeysColumns(now).filter(
    (column) => column.id === 'quota'
  )
  const table = useReactTable({
    columns,
    data: [props.apiKey],
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => (
              <th key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function renderQuota(apiKey: ApiKey = key) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, enabled: false } },
  })
  clients.push(client)
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <QuotaTable apiKey={apiKey} />
      </QueryClientProvider>
    </I18nextProvider>
  )
}

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  localStorage.clear()
  useSystemConfigStore
    .getState()
    .setConfig({ currency: { ...DEFAULT_CURRENCY_CONFIG } })
  vi.spyOn(api, 'get').mockResolvedValue({ data: { success: true, data: {} } })
})
afterEach(() => {
  cleanup()
  toast.dismiss()
  localStorage.clear()
  clients.splice(0).forEach((client) => client.clear())
  useSystemConfigStore
    .getState()
    .setConfig({ currency: { ...DEFAULT_CURRENCY_CONFIG } })
})

it('shows only the quota limit, with the currency in the header', () => {
  renderQuota()
  expect(
    screen.getByRole('columnheader', { name: 'Quota ($)' })
  ).toBeInTheDocument()
  const quota = screen.getByTitle('80')
  expect(quota).toHaveTextContent('80')
  expect(quota).not.toHaveTextContent('120')
  expect(quota).not.toHaveTextContent(/Remaining|Used amount|\$/)
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /Remaining/ })
  ).not.toBeInTheDocument()
})

it('shows Unlimited without the used amount when the key has no quota cap', () => {
  renderQuota({ ...key, unlimited_quota: true })
  const quota = screen.getByText('Unlimited')
  expect(quota).not.toHaveTextContent('120')
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('keeps a negative quota limit visible', () => {
  renderQuota({ ...key, remain_quota: -50000, used_quota: 500000 })
  expect(screen.getByText('-0.1')).toHaveClass('text-destructive')
})

it('keeps small custom-currency amounts exact', () => {
  useSystemConfigStore.getState().setConfig({
    currency: {
      ...DEFAULT_CURRENCY_CONFIG,
      quotaDisplayType: 'CUSTOM',
      customCurrencySymbol: '🐱',
    },
  })
  renderQuota({ ...key, remain_quota: 1900, used_quota: 1100 })
  expect(
    screen.getByRole('columnheader', { name: 'Quota (🐱)' })
  ).toBeInTheDocument()
  const quota = screen.getByTitle('0.0038')
  expect(quota).toHaveTextContent('0.0038')
  expect(quota).not.toHaveTextContent('🐱')
  expect(quota).not.toHaveTextContent('0.0022')
})

it('updates the visible quota when the limit changes', () => {
  const { rerender } = render(
    <I18nextProvider i18n={i18n}>
      <ApiKeyQuotaCell apiKey={key} now={now} />
    </I18nextProvider>
  )
  expect(screen.getByText('80')).toBeInTheDocument()
  rerender(
    <I18nextProvider i18n={i18n}>
      <ApiKeyQuotaCell
        apiKey={{ ...key, remain_quota: 90_000_000 }}
        now={now}
      />
    </I18nextProvider>
  )
  expect(screen.getByText('180')).toBeInTheDocument()
  expect(screen.queryByText('120')).not.toBeInTheDocument()
})

it('keeps a long quota limit inside the column', () => {
  renderQuota({ ...key, remain_quota: 123456789000000, used_quota: 0 })
  const quota = screen.getByText('246,913,578')
  expect(quota).toHaveClass('truncate', 'max-w-full', 'min-w-0')
})

function KeysPage() {
  return (
    <ApiKeysProvider>
      <ApiKeysTable />
      <ApiKeysDialogs />
      <Toaster />
    </ApiKeysProvider>
  )
}

async function renderKeysPage(status = 1, overrides: Partial<ApiKey> = {}) {
  let currentKey = { ...key, status, ...overrides }
  vi.mocked(api.get).mockImplementation(async (url) => {
    if (url.startsWith('/api/token/')) {
      return {
        data: { success: true, data: { items: [currentKey], total: 1 } },
      }
    }
    return { data: { success: true, data: { default: { ratio: 1 } } } }
  })
  const post = vi.spyOn(api, 'post').mockResolvedValue({
    data: { success: true, data: { key: 'fake-key-for-test-only' } },
  })
  const put = vi.spyOn(api, 'put').mockImplementation(async (_url, data) => {
    const update = data as { id: number; status: number }
    currentKey = { ...currentKey, status: update.status }
    return { data: { success: true, data: currentKey } }
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['status'], {})
  clients.push(client)
  const root = createRootRoute()
  const auth = createRoute({ getParentRoute: () => root, id: '_authenticated' })
  const keysRoute = createRoute({
    getParentRoute: () => auth,
    path: 'keys/',
    component: KeysPage,
  })
  const router = createRouter({
    routeTree: root.addChildren([auth.addChildren([keysRoute])]),
    history: createMemoryHistory({ initialEntries: ['/keys/'] }),
  })
  await router.load()
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nextProvider>
  )
  await screen.findByText(currentKey.name)
  return { post, put }
}

it('shows only the columns an ordinary user needs', async () => {
  await renderKeysPage()
  for (const name of ['Name', 'API Key', 'Created', 'Last Used']) {
    expect(screen.getByRole('columnheader', { name })).toBeInTheDocument()
  }
  // Status, group, model/IP restrictions, expiry and the combined time column
  // are gone: the list shows the two dates instead.
  for (const name of [
    'Status',
    'Group',
    'Models',
    'IP Restriction',
    'Expires',
    'Time',
  ]) {
    expect(
      screen.queryByRole('columnheader', { name })
    ).not.toBeInTheDocument()
  }
  const quotaHeader = screen.getByRole('columnheader', { name: 'Quota ($)' })
  const quota = screen.getByText('80')
  expect(quotaHeader).not.toHaveClass('pr-8')
  expect(quota.closest('td')).not.toHaveClass('pr-8')
  expect(quota).not.toHaveTextContent('120')
})

it('keeps the hidden columns hidden even with preferences stored by an older build', async () => {
  localStorage.setItem(
    'api-keys:column-visibility',
    JSON.stringify({
      model_limits: false,
    })
  )
  await renderKeysPage()
  expect(
    screen.getByRole('columnheader', { name: 'Created' })
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('columnheader', { name: 'Expires' })
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('columnheader', { name: 'Models' })
  ).not.toBeInTheDocument()
})

it('offers exactly two row actions: edit and delete', async () => {
  await renderKeysPage()
  expect(screen.getByRole('button', { name: 'Edit' })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Delete' })).toBeVisible()
  expect(
    screen.queryByRole('button', { name: 'Open menu' })
  ).not.toBeInTheDocument()
})

it('deletes a key only after the confirmation dialog is accepted', async () => {
  await renderKeysPage()
  const remove = vi.spyOn(api, 'delete').mockResolvedValue({
    data: { success: true },
  })
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Delete' }))

  // The click alone destroys nothing: a confirmation has to be accepted.
  expect(remove).not.toHaveBeenCalled()
  await user.click(await screen.findByRole('button', { name: 'Delete' }))
  await waitFor(() => expect(remove).toHaveBeenCalledWith('/api/token/7/'))
})

it.each([true, false])(
  'fetches a full key only on explicit copy and honors permission success=%s',
  async (success) => {
    const user = userEvent.setup()
    const { post } = await renderKeysPage()
    post.mockResolvedValue(
      success
        ? { data: { success: true, data: { key: 'fake-key-for-test-only' } } }
        : { data: { success: false, message: 'Verification required' } }
    )
    const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    expect(post).not.toHaveBeenCalled()
    // Copying lives in the key cell now; there is no row menu any more.
    expect(
      screen.queryByRole('button', { name: 'Open menu' })
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Copy API key' }))
    await waitFor(() => expect(post).toHaveBeenCalledWith('/api/token/7/key'))
    if (success) {
      await waitFor(() =>
        expect(copy).toHaveBeenCalledWith('sk-fake-key-for-test-only')
      )
    } else {
      await screen.findByText('Verification required')
      expect(copy).not.toHaveBeenCalled()
    }
  }
)

it('keeps full mobile information without group or quota section headings', async () => {
  const matchMedia = window.matchMedia
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...matchMedia(query),
    matches: query.includes('max-width'),
  }))
  i18n.addResourceBundle('zh', 'translation', zh.translation)
  await i18n.changeLanguage('zh')
  try {
    await renderKeysPage()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('额度 ($)')).not.toBeInTheDocument()
    expect(screen.queryByText('($)')).not.toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.queryByText('120')).not.toBeInTheDocument()
    expect(screen.getByText(zh.translation['Created'])).toBeInTheDocument()
    expect(screen.getByText(zh.translation['Last Used'])).toBeInTheDocument()
    expect(screen.getByText(zh.translation['Expires'])).toBeInTheDocument()
    expect(
      screen.queryByText(zh.translation['Group'], { exact: true })
    ).not.toBeInTheDocument()
    expect(screen.getByText('default')).toBeInTheDocument()
    expect(screen.getByText('1x')).toBeInTheDocument()
    expect(screen.getByText(zh.translation['Models'])).toBeInTheDocument()
    expect(
      screen.getByText(zh.translation['IP Restriction'])
    ).toBeInTheDocument()
  } finally {
    await i18n.changeLanguage('en')
  }
})

it('keeps mobile quota readable and opens complete model and IP restrictions by tapping', async () => {
  const matchMedia = window.matchMedia
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...matchMedia(query),
    matches: query.includes('max-width'),
  }))
  await renderKeysPage(1, {
    name: 'production-with-a-long-key-name',
    used_quota: 2245080000,
    unlimited_quota: true,
    model_limits_enabled: true,
    model_limits: 'model-alpha,model-beta-with-a-long-name',
    allow_ips: '192.0.2.1\n2001:db8::1',
  })
  const quota = screen.getByText('Unlimited')
  expect(quota).not.toHaveTextContent('4,490.16')
  expect(quota).toHaveClass('text-right', 'truncate')
  await userEvent.click(screen.getByRole('button', { name: /Models: 2 model/ }))
  let details = await screen.findByRole('dialog')
  expect(within(details).getByText('model-alpha')).toBeVisible()
  expect(within(details).getByText('model-beta-with-a-long-name')).toBeVisible()
  await userEvent.keyboard('{Escape}')
  await userEvent.click(
    screen.getByRole('button', { name: /IP Restriction: 2 IP/ })
  )
  details = await screen.findByRole('dialog')
  expect(within(details).getByText('192.0.2.1')).toBeVisible()
  expect(within(details).getByText('2001:db8::1')).toBeVisible()
})

it('renders the key list without any filter or view controls', async () => {
  await renderKeysPage()
  expect(
    screen.queryByPlaceholderText('Filter by name...')
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Reset' })
  ).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Status' })).not.toBeInTheDocument()
})
