import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'

import { Pricing } from '../index'
import type { PricingData } from '../types'

// The details drawer pulls in `@visactor/react-vchart`, whose extensionless ESM
// imports do not resolve under Vitest. The layout contract under test never
// renders the drawer, so replace the module instead of loading the charts.
vi.mock('../components/model-details', () => ({
  ModelDetails: () => null,
  ModelDetailsContent: () => null,
  ModelDetailsDrawer: () => null,
}))

const PRICING_PAYLOAD: PricingData = {
  success: true,
  data: [
    {
      id: 1,
      model_name: 'console-layout-model',
      quota_type: 0,
      model_ratio: 1,
      completion_ratio: 3,
      enable_groups: ['default'],
      group_ratio: { default: 1 },
    },
  ],
  vendors: [],
  group_ratio: { default: 1 },
  usable_group: { default: { desc: 'Default', ratio: 1 } },
  supported_endpoint: {},
  auto_groups: [],
}

let queryClient: QueryClient

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  vi.spyOn(api, 'get').mockImplementation(async (url) => {
    if (url === '/api/pricing') {
      return { data: PRICING_PAYLOAD }
    }
    if (url === '/api/perf-metrics/summary') {
      return { data: { success: true, data: { models: [] } } }
    }
    if (url === '/api/status') {
      return { data: { success: true, data: {} } }
    }
    throw new Error(`Unexpected GET ${url}`)
  })
})

afterEach(() => {
  queryClient.clear()
})

function ConsolePricing() {
  return <Pricing variant='console' />
}

function PublicPricing() {
  return <Pricing />
}

async function renderModelSquare(variant?: 'public' | 'console') {
  const router = createRouter({
    routeTree: createRootRoute({
      component: variant === 'console' ? ConsolePricing : PublicPricing,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await router.load()
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

const PUBLIC_HERO_COPY =
  'Discover curated AI models, compare pricing and capabilities, and choose the right model for every scenario.'

describe('model square layouts', () => {
  it('renders the catalog in the console shell without the public hero', async () => {
    await renderModelSquare('console')

    // The catalog finishes loading before the toolbar replaces its skeleton.
    expect(await screen.findByText('console-layout-model')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Model Square' })).toBeVisible()
    expect(screen.queryByText(PUBLIC_HERO_COPY)).not.toBeInTheDocument()
    expect(
      screen.queryByText(/This site currently has/)
    ).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Search models' })).toBeVisible()
    expect(screen.getByRole('button', { name: /Filter/ })).toBeVisible()
  })

  it('keeps the hero copy on the public model square', async () => {
    await renderModelSquare()

    expect(await screen.findByText(/This site currently has/)).toBeVisible()
    expect(screen.getByText(PUBLIC_HERO_COPY)).toBeVisible()
  })
})
