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
  it('renders only the gateway entry for a signed-out visitor', async () => {
    await renderHome(false)

    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toHaveTextContent(
      'Connect to quality models worldwide through a Stable API platform'
    )
    expect(title.querySelector('.text-\\[\\#1E3A8A\\]')).toHaveTextContent(
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

    const enterConsole = screen.getByRole('button', {
      name: 'Enter the console',
    })
    expect(enterConsole).toHaveAttribute('href', '/dashboard')
    expect(enterConsole.className).toContain('bg-[#2563EB]')
    expect(enterConsole.className).toContain('hover:bg-[#1D4ED8]!')

    // The address is the only hard fact the page carries, so it stays visible
    // and copyable without opening the console.
    expect(screen.getByText('API address placeholder')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Copy to clipboard' })
    ).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute(
      'href',
      '/about'
    )
    expect(screen.getByRole('button', { name: 'Console' })).toHaveAttribute(
      'href',
      '/dashboard'
    )
    expect(
      screen.getByRole('button', { name: 'Change language' })
    ).toBeInTheDocument()
  })

  it('drops the decorative model strip, the step cards and the example terminal', async () => {
    await renderHome(false)

    expect(screen.queryByText('Claude')).not.toBeInTheDocument()
    expect(screen.queryByText('Gpt')).not.toBeInTheDocument()
    expect(screen.queryByText('Gemini')).not.toBeInTheDocument()
    expect(screen.queryByText('Grok')).not.toBeInTheDocument()
    expect(screen.queryByText('API call example')).not.toBeInTheDocument()
    expect(screen.queryByText('-X POST')).not.toBeInTheDocument()
    expect(screen.queryByText('Get an API key')).not.toBeInTheDocument()
    expect(screen.queryByText('Start calling the API')).not.toBeInTheDocument()
    expect(screen.queryByText('01')).not.toBeInTheDocument()

    // No model-list entry point and no second hero CTA either.
    expect(screen.queryByRole('link', { name: 'Model list' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'View models' })
    ).not.toBeInTheDocument()
    expect(document.querySelectorAll('a[href="/pricing"]')).toHaveLength(0)
  })

  it('centers the hero column and puts the address directly under the CTA', async () => {
    await renderHome(false)

    const title = screen.getByRole('heading', { level: 1 })
    const hero = title.closest('section')
    expect(hero?.className).toContain('items-center')
    expect(hero?.className).toContain('text-center')
    // The hero claims a share of the viewport so a tall screen doesn't collapse
    // into one blank band between the copy and the pinned footer.
    expect(hero?.className).toContain('--home-vh')
    expect(hero?.className).toContain('justify-center')
    // The page height is measured in JS rather than trusting viewport units:
    // Edge resolved 100svh taller than the visible area and left a blank strip.
    expect(
      title.closest('main')?.parentElement?.className
    ).toContain('min-h-[var(--home-vh,100svh)]')
    // The short page centers itself in the viewport instead of leaving a hole
    // above the pinned footer.
    expect(title.closest('main')?.className).toContain('justify-center')

    const cta = screen.getByRole('button', { name: 'Enter the console' })
    const address = screen.getByText('API address placeholder')
    expect(
      cta.compareDocumentPosition(address) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('keeps the ice-blue backdrop decorative and the hero surfaces glassy', async () => {
    await renderHome(false)

    const backdrop = document.querySelector('.home-backdrop')
    expect(backdrop).toHaveAttribute('aria-hidden')
    for (const layer of [
      '.home-grid',
      '.home-glow-a',
      '.home-glow-b',
      '.home-frame',
    ]) {
      expect(backdrop?.querySelector(layer)).not.toBeNull()
    }
    // The swept highlight was removed: two slow glows plus the grid carry the
    // depth, and a third moving layer read as a smear on white.
    expect(backdrop?.querySelector('.home-sheen')).toBeNull()

    const badge = screen.getByText('Models on this site share one address')
    expect(badge.className).toContain('backdrop-blur-md')
    expect(badge.className).toContain('bg-white/70')
    expect(badge.className).toContain('border-[#DCE7F7]')
    // Technical label treatment: monospace plus wide tracking, no copy change.
    expect(badge.className).toContain('font-mono')
    expect(badge.className).toContain('tracking-[0.14em]')

    const chip = screen.getByText('API address placeholder').parentElement
    expect(chip?.className).toContain('backdrop-blur-md')
    expect(chip?.className).toContain('bg-white/70')
    expect(chip?.className).toContain('border-[#D7E4F7]')

    // The CTA stays the single solid brand-blue action, now with a soft halo.
    const cta = screen.getByRole('button', { name: 'Enter the console' })
    expect(cta.className).toContain('bg-[#2563EB]')
    expect(cta.className).toContain('hover:bg-[#1D4ED8]!')
    expect(cta.className).toContain('hover:-translate-y-px')
    expect(cta.className).toContain('0_18px_38px_-16px_rgba(37,99,235,0.65)')
  })

  it('sends a signed-in user to the console', async () => {
    await renderHome(true)

    expect(
      screen.getByRole('button', { name: 'Enter the console' })
    ).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('button', { name: 'Console' })).toHaveAttribute(
      'href',
      '/dashboard'
    )
  })

  it('uses the brand name when the site name is still the default', async () => {
    useSystemConfigStore.getState().setConfig({ systemName: 'Stable API' })
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
    // The raw default name never renders as text here; the headline's
    // "Stable API" highlight is a separate copy string.
    expect(screen.queryByText('New API')).not.toBeInTheDocument()
  })

  it('uses an uploaded logo and still shows the brand name', async () => {
    useSystemConfigStore.getState().setConfig({
      systemName: 'Stable API',
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
