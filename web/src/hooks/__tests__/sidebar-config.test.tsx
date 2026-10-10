import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { parseSidebarModulesAdmin } from '@/features/system-settings/maintenance/config'
import { useAuthStore } from '@/stores/auth-store'

import { useSidebarConfig } from '../use-sidebar-config'
import { useSidebarData } from '../use-sidebar-data'

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  useAuthStore.getState().auth.reset()
})

function sidebarFor(admin?: object, user?: object, canConfigure = true) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['status'], {
    SidebarModulesAdmin: admin ? JSON.stringify(admin) : '',
  })
  useAuthStore.getState().auth.setUser({
    id: 1,
    username: 'alice',
    role: 1,
    permissions: { sidebar_settings: canConfigure },
    sidebar_modules: user ? JSON.stringify(user) : '',
  })
  function Wrapper(props: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        {props.children}
      </QueryClientProvider>
    )
  }
  const result = renderHook(
    () => useSidebarConfig(useSidebarData().navGroups),
    { wrapper: Wrapper }
  )
  return result
}

describe('security sidebar visibility', () => {
  it('old configurations show Security & Access immediately after Profile and keep API Keys', () => {
    const { result } = sidebarFor(
      { personal: { enabled: true, personal: true, topup: true } },
      { personal: { enabled: true, personal: true } }
    )
    expect(
      result.current
        .find((group) => group.id === 'general')
        ?.items.map((item) => item.title)
    ).toEqual([
      'Dashboard',
      'Model Square',
      'API Keys',
      'Usage Records',
      'Wallet',
      'Profile',
      'Security & Access',
    ])
    expect(
      result.current
        .flatMap((group) => group.items)
        .some((item) => item.title === 'API Keys')
    ).toBe(true)
  })
  it.each([
    [{ personal: { enabled: true, security: false } }, undefined],
    [{ personal: { enabled: false } }, { personal: { security: true } }],
    [undefined, { personal: { enabled: true, security: false } }],
    [undefined, { personal: { enabled: false } }],
  ])(
    'admin or user disablement hides Security & Access (%j, %j)',
    (admin, user) => {
      const { result } = sidebarFor(admin, user)
      expect(
        result.current
          .flatMap((group) => group.items)
          .some((item) => item.title === 'Security & Access')
      ).toBe(false)
    }
  )
  it('users without sidebar configuration permission retain the admin view', () => {
    const { result } = sidebarFor(
      undefined,
      { personal: { security: false } },
      false
    )
    expect(
      result.current
        .flatMap((group) => group.items)
        .some((item) => item.title === 'Security & Access')
    ).toBe(true)
  })
})

describe('console sidebar entries', () => {
  // The chat area, the playground and the task/drawing logs stay out of the
  // root menu. Their routes remain reachable by URL, and the admin-only
  // reporting workspaces (call analytics, audit) sit in the Admin group.
  const stillHidden = ['Chat', 'Playground', 'Task Logs']

  it('lists the console, personal and admin entries in order', () => {
    const { result } = sidebarFor()
    const titles = result.current
      .flatMap((group) => group.items)
      .map((item) => item.title)
    expect(titles).toEqual([
      'Dashboard',
      'Model Square',
      'API Keys',
      'Usage Records',
      'Wallet',
      'Profile',
      'Security & Access',
      'Model Call Analytics',
      'Audit Logs',
      'Channels',
      'Models',
      'Users',
      'Redemption Codes',
      'Subscriptions',
      'System Info',
      'Task Plugins',
      'System Settings',
    ])
    // The personal group was merged into the console group.
    expect(result.current.map((group) => group.title)).toEqual([
      'User Console',
      'Admin Console',
    ])
    for (const title of stillHidden) {
      expect(titles).not.toContain(title)
    }
  })

  it('keeps Security & Access in the console group', () => {
    const { result } = sidebarFor()
    const groupTitles = (id: string) =>
      result.current
        .find((group) => group.id === id)
        ?.items.map((item) => item.title)
    expect(groupTitles('general')).toContain('Security & Access')
    expect(groupTitles('admin')).not.toContain('Security & Access')
  })

  it('keeps the saved audit flag from duplicating the admin audit entry', () => {
    const config = parseSidebarModulesAdmin(
      '{"console":{"enabled":true,"log":true}}'
    )
    expect(config.console.audit).toBe(true)
    const { result } = sidebarFor(config)
    const titles = result.current
      .flatMap((group) => group.items)
      .map((item) => item.title)
    // The audit workspace is an admin entry; the saved console.audit flag must
    // not add a second copy to the user console.
    expect(titles.filter((title) => title === 'Audit Logs')).toHaveLength(1)
    expect(
      result.current
        .find((group) => group.id === 'admin')
        ?.items.map((item) => item.title)
    ).toContain('Audit Logs')
    expect(titles).toContain('Usage Records')
  })

  it('hiding Usage Records leaves the rest of the menu', () => {
    const { result } = sidebarFor({ console: { enabled: true, log: false } })
    const titles = result.current
      .flatMap((group) => group.items)
      .map((item) => item.title)
    expect(titles).not.toContain('Usage Records')
    expect(titles).toContain('API Keys')
    expect(titles).toContain('Models')
  })
})
