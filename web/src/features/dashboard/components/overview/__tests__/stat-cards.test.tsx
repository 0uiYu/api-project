import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

import { StatCards } from '../stat-cards'

const CARD_TITLES = [
  'Account balance',
  'Total spent',
  'API Keys',
  'Total tokens',
]

let client: QueryClient

function hoursAgoBucket(hours: number) {
  const now = Math.floor(Date.now() / 1000)
  return now - hours * 3600 - (now % 3600)
}

beforeEach(() => {
  useAuthStore.getState().auth.setUser({
    id: 1,
    username: 'stat-user',
    role: 1,
    group: 'default',
    quota: 100000,
    used_quota: 40000,
    request_count: 8,
  })
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
})

afterEach(() => {
  cleanup()
  client.clear()
  useAuthStore.setState(useAuthStore.getInitialState(), true)
  vi.restoreAllMocks()
})

function mockUsageEndpoints() {
  vi.spyOn(api, 'get').mockImplementation(async (url) => {
    if (url === '/api/data/self') {
      return {
        data: {
          success: true,
          data: [
            {
              created_at: hoursAgoBucket(0),
              count: 341,
              quota: 20000,
              token_used: 1500,
              model_name: 'model-a',
            },
          ],
        },
      }
    }
    if (url === '/api/token/?p=1&size=100') {
      return {
        data: {
          success: true,
          data: {
            items: [
              { id: 1, name: 'main', key: 'masked', status: 1 },
              { id: 2, name: 'old', key: 'masked', status: 2 },
            ],
            total: 2,
          },
        },
      }
    }
    if (url.startsWith('/api/log/self/stat')) {
      return {
        data: {
          success: true,
          data: { quota: 20000, rpm: 3, tpm: 120, token: 1234567 },
        },
      }
    }
    throw new Error(`Unexpected GET ${url}`)
  })
}

async function renderStatCards() {
  const root = createRootRoute()
  const index = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: StatCards,
  })
  const wallet = createRoute({
    getParentRoute: () => root,
    path: '/wallet',
    component: () => null,
  })
  const keys = createRoute({
    getParentRoute: () => root,
    path: '/keys',
    component: () => null,
  })
  const router = createRouter({
    routeTree: root.addChildren([index, wallet, keys]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await router.load()
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe('dashboard stat cards', () => {
  it('renders the four account cards in the documented order', async () => {
    mockUsageEndpoints()
    await renderStatCards()

    await screen.findByText('2')

    const titles = [
      ...document.querySelectorAll('[data-card-hover="false"]'),
    ].map((card) => card.querySelector('div')?.textContent)

    expect(titles).toEqual(CARD_TITLES)
  })

  it('shows the key count and the cumulative tokens', async () => {
    mockUsageEndpoints()
    await renderStatCards()

    expect(await screen.findByText('2')).toBeVisible()
    expect(await screen.findByText('1.23M')).toBeVisible()
    // Descriptions were trimmed from the spend and key cards on request.
    expect(screen.queryByText('1 enabled')).not.toBeInTheDocument()
    expect(screen.queryByText('Cumulative')).not.toBeInTheDocument()
    // The today-requests card is gone; neither its title nor its total returns.
    expect(screen.queryByText('Today requests')).not.toBeInTheDocument()
    expect(screen.queryByText('Total: 8')).not.toBeInTheDocument()
    // The last-used card was replaced by cumulative tokens.
    expect(screen.queryByText('Last request')).not.toBeInTheDocument()
    expect(screen.queryByText('Recent activity')).not.toBeInTheDocument()
  })

  it('puts the recharge entry on the balance card', async () => {
    mockUsageEndpoints()
    await renderStatCards()

    const recharge = await screen.findByRole('button', {
      name: 'Go to recharge',
    })

    expect(recharge).toHaveAttribute('href', '/wallet')
    expect(
      recharge.closest('[data-card-hover="false"]')?.textContent
    ).toContain('Account balance')
  })

  it('shows the cumulative spend the account has already used', async () => {
    mockUsageEndpoints()
    await renderStatCards()

    const spent = await screen.findByText('Total spent')
    expect(spent.closest('[data-card-hover="false"]')).toBeVisible()
    expect(screen.queryByText('Available for use')).not.toBeInTheDocument()
  })

  it('reports a failure instead of showing zero usage', async () => {
    vi.spyOn(api, 'get').mockImplementation(async (url) => {
      if (url === '/api/data/self') {
        throw new Error('boom')
      }
      if (url === '/api/token/?p=1&size=100') {
        return {
          data: { success: true, data: { items: [], total: 0 } },
        }
      }
      throw new Error(`Unexpected GET ${url}`)
    })
    await renderStatCards()

    expect(await screen.findByText('Failed to load usage data')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible()
  })
})
