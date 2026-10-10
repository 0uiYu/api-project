import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/stores/auth-store'
import { useSystemConfigStore } from '@/stores/system-config-store'

import { PlatformHome } from '../components/platform-home'

afterEach(() => {
  cleanup()
  useAuthStore.setState(useAuthStore.getInitialState(), true)
  useSystemConfigStore.setState(useSystemConfigStore.getInitialState(), true)
})

async function renderHome(isAuthenticated: boolean) {
  useSystemConfigStore.getState().setConfig({ systemName: 'Northline' })
  if (isAuthenticated) {
    useAuthStore.getState().auth.setUser({
      id: 1,
      username: 'ada',
      role: 1,
    })
  }
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <PlatformHome />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await router.load()
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe('platform home', () => {
  it('explains one address and the call steps for a signed-out visitor', async () => {
    await renderHome(false)

    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toHaveTextContent(
      'Connect to quality models worldwide through a Stable API platform'
    )
    expect(title.querySelector('.text-\\[\\#2563EB\\]')).toHaveTextContent(
      'Stable API'
    )
    expect(
      screen.getByText('Models on this site share one address')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'One API for the models on this site, so developers can connect and focus on the product.'
      )
    ).toBeInTheDocument()
    expect(screen.getAllByText('Northline')).toHaveLength(2)
    expect(document.querySelector('img[src="/stable-logo.png"]')).toHaveAttribute(
      'alt',
      ''
    )
    expect(screen.getByText('API address placeholder')).toBeInTheDocument()
    expect(screen.getByText('-X POST')).toBeInTheDocument()
    expect(screen.getByText('/chat/completions')).toBeInTheDocument()
    expect(screen.getByText('API call example')).toBeInTheDocument()
    expect(screen.queryByText(/200|response time/i)).not.toBeInTheDocument()
    const example = screen.getByText('-X POST').closest('pre')
    expect(example?.parentElement?.className).toContain('max-w-[540px]')
    expect(
      screen.queryByRole('heading', { name: 'Register an account' })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Get an API key' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Set the API address' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Start calling the API' })
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Create a Northline account and open the platform.')
    ).not.toBeInTheDocument()
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByText('03')).toBeInTheDocument()
    expect(screen.queryByText('04')).not.toBeInTheDocument()
    expect(screen.getByText('Create a key in the console.')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Set the request address and model parameters from the docs.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText('Connect the API to your own application.')
    ).toBeInTheDocument()
    const steps = screen
      .getByRole('heading', { name: 'Get an API key' })
      .closest('ol')
    if (!(steps instanceof HTMLOListElement)) {
      throw new Error('missing steps')
    }
    expect(steps.className).toContain('lg:grid-cols-3')
    expect(steps.className).toContain('sm:grid-cols-2')
    expect(
      title.compareDocumentPosition(steps) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(steps.children).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'Model list' })).toHaveAttribute(
      'href',
      '/pricing'
    )
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute(
      'href',
      '/about'
    )
    expect(
      screen.getByRole('button', { name: 'Copy to clipboard' })
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Programmers' })).not.toBeInTheDocument()
    expect(screen.queryByText('New API')).not.toBeInTheDocument()
    expect(screen.queryByText(/localhost|5173|3000/)).not.toBeInTheDocument()
    expect(
      screen.queryByText(/Cherry Studio|Channels/)
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Change language' })
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Create your account' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Start now' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View models' })).toHaveAttribute(
      'href',
      '/pricing'
    )
    const consoleButton = screen.getByRole('button', { name: 'Console' })
    expect(consoleButton).toHaveAttribute('href', '/dashboard')
    expect(consoleButton.className).toContain('hover:bg-[#1D4ED8]!')
    const enterConsole = screen.getByRole('button', {
      name: 'Enter the console',
    })
    expect(enterConsole).toHaveAttribute('href', '/dashboard')
    expect(enterConsole.className).toContain('hover:bg-[#1D4ED8]!')
  })

  it('shows model cards under the hero without the figure row', async () => {
    await renderHome(false)

    const title = screen.getByRole('heading', { level: 1 })
    const steps = screen.getByRole('heading', { name: 'Get an API key' })
    const modelList = screen
      .getByRole('link', { name: 'Claude Anthropic' })
      .closest('ul')
    expect(screen.queryByText('Major model providers')).not.toBeInTheDocument()
    expect(screen.queryByText('One key for every call')).not.toBeInTheDocument()
    expect(screen.queryByText('No code changes')).not.toBeInTheDocument()
    expect(modelList?.className).toContain('grid-cols-2')
    expect(modelList?.className).toContain('lg:grid-cols-4')
    expect(
      title.compareDocumentPosition(modelList as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      (modelList as Node).compareDocumentPosition(steps) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    for (const name of [
      'Claude Anthropic',
      'GPT OpenAI',
      'Gemini Google',
      'Grok xAI',
    ]) {
      const card = screen.getByRole('link', { name })
      expect(card).toHaveAttribute('href', '/models')
      expect(card.className).toContain('rounded-lg')
      expect(card.className).toContain('items-center')
      expect(card.className).toContain('border-[#E7ECF3]')
      const mark = card.querySelector('svg')
      expect(mark).toHaveAttribute('viewBox', '0 0 24 24')
      expect(mark?.getAttribute('class')).toContain('size-10')
      expect(mark?.innerHTML).toContain('#0F172A')
    }
  })

  it('sends a signed-in user to the console', async () => {
    await renderHome(true)

    expect(screen.getByRole('button', { name: 'Console' })).toHaveAttribute(
      'href',
      '/dashboard'
    )
    expect(
      screen.getByRole('button', { name: 'Enter the console' })
    ).toHaveAttribute('href', '/dashboard')
    expect(
      screen.queryByRole('button', { name: 'Create your account' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Start now' })
    ).not.toBeInTheDocument()
  })

  it('uses the brand name when the site name is still the default', async () => {
    useSystemConfigStore.getState().setConfig({ systemName: 'New API' })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const router = createRouter({
      routeTree: createRootRoute({
        component: () => <PlatformHome />,
      }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    await router.load()
    render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    )

    expect(screen.getByRole('img', { name: 'Stable' })).toHaveAttribute(
      'src',
      '/stable-logo.png'
    )
    expect(screen.getAllByText('Stable')).toHaveLength(1)
    expect(
      screen.queryByText('Create a Stable account and open the platform.')
    ).not.toBeInTheDocument()
    expect(screen.queryByText('New API')).not.toBeInTheDocument()
  })

  it('uses an uploaded logo and still shows the brand name', async () => {
    useSystemConfigStore.getState().setConfig({
      systemName: 'New API',
      logo: '/custom-mark.png',
    })
    useSystemConfigStore.getState().setLoadedLogoUrl('/custom-mark.png')
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const router = createRouter({
      routeTree: createRootRoute({
        component: () => <PlatformHome />,
      }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    await router.load()
    render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    )

    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      '/custom-mark.png'
    )
    expect(document.querySelector('img[src="/stable-logo.png"]')).toBeNull()
    expect(screen.getAllByText('Stable')).toHaveLength(2)
  })
})
