import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

import { StatCards } from '../stat-cards'

const CARD_TITLES = [
  'Balance',
  'API Keys',
  'Requests today',
  'Spend today',
  'Tokens today',
  'Cumulative tokens',
  'Performance metrics',
  'Average response time',
]

let client: QueryClient

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
  vi.spyOn(api, 'get').mockImplementation(async (url) => {
    if (url === '/api/data/self') {
      return {
        data: {
          success: true,
          data: [{ created_at: 1, count: 3, quota: 20000, token_used: 1500 }],
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
    if (url === '/api/user/self/groups') {
      return {
        data: {
          success: true,
          data: { default: { desc: 'Default', ratio: 2 } },
        },
      }
    }
    if (url.startsWith('/api/log/self/stat')) {
      return { data: { success: true, data: { quota: 0, rpm: 12, tpm: 345 } } }
    }
    if (url === '/api/perf-metrics/summary') {
      return {
        data: {
          success: true,
          data: {
            summary: { avg_latency_ms: 320, success_rate: 99.5, avg_tps: 10 },
            models: [],
          },
        },
      }
    }
    throw new Error(`Unexpected GET ${url}`)
  })
})

afterEach(() => {
  cleanup()
  client.clear()
  useAuthStore.setState(useAuthStore.getInitialState(), true)
})

async function renderStatCards() {
  render(
    <QueryClientProvider client={client}>
      <StatCards />
    </QueryClientProvider>
  )

  // Wait for the slowest card before asserting the rest.
  await screen.findByText('12 RPM')
}

describe('dashboard stat cards', () => {
  it('renders the eight account, usage and performance cards', async () => {
    await renderStatCards()

    for (const title of CARD_TITLES) {
      expect(screen.getByText(title)).toBeVisible()
    }
  })

  it('shows live rates, key counts and cumulative request totals', async () => {
    await renderStatCards()

    expect(screen.getByText('12 RPM')).toBeVisible()
    expect(screen.getByText('345 TPM')).toBeVisible()
    expect(screen.getByText('320 ms')).toBeVisible()
    expect(screen.getByText('1 enabled')).toBeVisible()
    expect(screen.getByText('Total: 8')).toBeVisible()
  })
})
