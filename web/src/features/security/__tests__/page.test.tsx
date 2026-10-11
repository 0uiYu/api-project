import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toaster } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Profile } from '@/features/profile'
import type { UserProfile } from '@/features/profile/types'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

import { Security } from '../index'

const baseProfile: UserProfile = {
  id: 1,
  username: 'alice',
  display_name: 'Alice',
  role: 1,
  group: 'default',
  quota: 1000000,
  used_quota: 0,
  request_count: 0,
  status: 1,
  aff_count: 0,
  aff_quota: 0,
  aff_history_quota: 0,
  created_time: 0,
  setting: JSON.stringify({
    notify_type: 'email',
    quota_warning_threshold: 500000,
  }),
}

let currentProfile: UserProfile = baseProfile

beforeEach(() => {
  currentProfile = {
    ...baseProfile,
    setting: baseProfile.setting,
  }
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  })
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
  useAuthStore.getState().auth.setUser({
    ...currentProfile,
    permissions: { sidebar_settings: false },
  })
  vi.spyOn(api, 'get').mockImplementation(async (url) => {
    if (url === '/api/user/access_tokens') {
      return { data: { success: true, data: { items: [], legacy: null } } }
    }
    if (url === '/api/user/access_tokens/catalog') {
      return {
        data: {
          success: true,
          data: { groups: [], max_tokens: 20, default_expiry_days: 30 },
        },
      }
    }
    if (url === '/api/user/self') {
      return { data: { success: true, data: currentProfile } }
    }
    if (url === '/api/user/passkey') {
      return { data: { success: true, data: { enabled: false } } }
    }
    if (url === '/api/user/2fa/status') {
      return {
        data: {
          success: true,
          data: { enabled: false, locked: false, backup_codes_remaining: 0 },
        },
      }
    }
    if (url === '/api/user/sessions') {
      return { data: { success: true, data: [] } }
    }
    throw new Error(`Unexpected GET ${url}`)
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  useAuthStore.getState().auth.reset()
  vi.restoreAllMocks()
})

function stubAvatarFileReader() {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  class ImmediateImage {
    width = 4
    height = 4
    private loadListener: (() => void) | undefined

    addEventListener(event: string, listener: () => void) {
      if (event === 'load') this.loadListener = listener
    }

    set src(_value: string) {
      this.loadListener?.()
    }
  }
  vi.stubGlobal('Image', ImmediateImage)
}

const tinyPng = () =>
  new File(
    [
      Uint8Array.from(
        atob(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        ),
        (char) => char.charCodeAt(0)
      ),
    ],
    'avatar.png',
    { type: 'image/png' }
  )

async function renderPage(path = '/security') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['status'], {
    checkin_enabled: false,
    wechat_login: true,
    github_oauth: true,
    oidc_enabled: true,
    custom_oauth_providers: [
      {
        id: 1,
        name: 'Gitea',
        slug: 'gitea',
        client_id: 'test-client',
        authorization_endpoint: 'https://example.com/oauth/authorize',
        scopes: 'openid',
      },
    ],
  })
  const root = createRootRoute()
  const security = createRoute({
    getParentRoute: () => root,
    path: '/security',
    component: Security,
  })
  const personal = createRoute({
    getParentRoute: () => root,
    path: '/profile',
    component: Profile,
  })
  const router = createRouter({
    routeTree: root.addChildren([security, personal]),
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  await router.load()
  const rendered = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  )
  return { ...rendered, router }
}

describe('security page migration', () => {
  it('stacks identity and account sections in one sheet', async () => {
    currentProfile = { ...currentProfile, role: 10 }
    await renderPage()
    const login = await screen.findByRole('region', {
      name: 'Login & Authentication',
    })
    expect(
      screen.getAllByRole('region').flatMap((region) => {
        const heading = within(region).queryAllByRole('heading')[0]
        return heading ? [heading.textContent] : []
      })
    ).toEqual([
      'Login & Authentication',
      'Sessions & Access',
      'Account Actions',
      'Security verification',
      'Privacy',
    ])
    expect(
      within(login).getByRole('button', { name: 'Change Password' })
    ).toBeVisible()
    expect(within(login).getByText('Account Bindings')).toBeVisible()
    expect(login).toHaveClass('md:grid-cols-[11rem_minmax(0,1fr)]')
    const identity = screen
      .getByText('@alice')
      .closest('[data-slot="profile-identity"]')
    const sheet = screen
      .getByText('@alice')
      .closest('[data-slot="profile-sheet"]')
    expect(identity).toHaveClass('bg-[#F4F8FC]')
    expect(identity).toContainElement(
      screen.getByRole('button', { name: 'Upload avatar' })
    )
    expect(
      identity?.querySelector('[data-slot="profile-identity-actions"]')
    ).toHaveClass('sm:ms-auto')
    const verification = screen.getByRole('region', {
      name: 'Security verification',
    })
    const privacy = screen.getByRole('region', { name: 'Privacy' })
    expect(sheet).toContainElement(login)
    expect(sheet).toContainElement(verification)
    expect(sheet).toContainElement(privacy)
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(sheet).not.toHaveClass(
      'xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.46fr)]'
    )
    expect(await within(verification).findByText('Passkey Login')).toBeVisible()
    expect(
      await within(verification).findByText('Two-Factor Authentication')
    ).toBeVisible()
    expect(
      within(privacy).getByRole('switch', { name: 'Record IP Address' })
    ).toBeVisible()
    const access = screen.getByRole('region', { name: 'Sessions & Access' })
    expect(within(access).getByText('Access tokens')).toBeVisible()
    expect(
      await within(access).findByText('No active login sessions')
    ).toBeVisible()
    expect(
      within(screen.getByRole('region', { name: 'Account Actions' })).getByRole(
        'button',
        { name: 'Delete Account' }
      )
    ).toBeVisible()
  })

  it('built-in and custom bindings share one compact responsive grid', async () => {
    currentProfile = { ...currentProfile, role: 10 }
    await renderPage()
    const bindings = await screen.findByRole('list', {
      name: 'Account Bindings',
    })
    expect(within(bindings).getAllByRole('listitem')).toHaveLength(5)
    expect(within(bindings).getByText('Gitea')).toBeVisible()
    expect(bindings).toHaveClass(
      'grid-cols-1',
      'sm:grid-cols-2',
      'lg:grid-cols-3',
      'gap-2'
    )
    expect(screen.queryByText('Custom OAuth')).not.toBeInTheDocument()
  })

  it('hides tokens, verification, privacy and bindings from an ordinary user', async () => {
    await renderPage()
    expect(
      await screen.findByRole('button', { name: 'Change Password' })
    ).toBeVisible()
    expect(
      screen.getByRole('region', { name: 'Sessions & Access' })
    ).toBeVisible()
    expect(await screen.findByText('No active login sessions')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Delete Account' })).toBeVisible()
    expect(screen.queryByText('Account Bindings')).not.toBeInTheDocument()
    expect(screen.queryByText('Access tokens')).not.toBeInTheDocument()
    expect(screen.queryByText('Security verification')).not.toBeInTheDocument()
    expect(screen.queryByText('Privacy')).not.toBeInTheDocument()
    expect(screen.queryByText('Passkey Login')).not.toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalledWith('/api/user/passkey')
    expect(api.get).not.toHaveBeenCalledWith('/api/user/2fa/status')
    expect(api.get).not.toHaveBeenCalledWith('/api/user/access_tokens')
  })

  it('the password action opens the existing dialog by keyboard and Escape closes it', async () => {
    const user = userEvent.setup()
    await renderPage()
    const action = await screen.findByRole('button', {
      name: 'Change Password',
    })
    action.focus()
    await user.keyboard('{Enter}')
    const dialog = await screen.findByRole('dialog', {
      name: 'Change Password',
    })
    expect(within(dialog).getByLabelText('Current Password')).toBeVisible()
    expect(
      within(dialog).getByLabelText('New Password', { exact: true })
    ).toBeVisible()
    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
  })

  it('shows an avatar upload on the profile page and rejects a non-image file', async () => {
    const put = vi.spyOn(api, 'put').mockResolvedValue({
      data: { success: true },
    })
    await renderPage()
    expect(
      await screen.findByRole('button', { name: 'Upload avatar' })
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeVisible()
    const input = screen.getByLabelText('Avatar file')
    // The accept attribute stops the test helper from delivering this file.
    // Dispatch the change directly so the page's own type check still runs.
    fireEvent.change(input, {
      target: {
        files: [
          new File(['not-an-image'], 'notes.txt', { type: 'text/plain' }),
        ],
      },
    })
    expect(put).not.toHaveBeenCalled()
    expect(
      await screen.findByText('Choose a PNG, JPEG, or WebP image')
    ).toBeVisible()
  })

  it('shows an uploaded avatar on the profile card and keeps the other settings', async () => {
    stubAvatarFileReader()
    vi.spyOn(api, 'put').mockImplementation(async (_url, data) => {
      const avatar = (data as { avatar?: string }).avatar
      const setting = JSON.parse(String(currentProfile.setting)) as {
        notify_type?: string
        avatar?: string
      }
      if (avatar) setting.avatar = avatar
      else delete setting.avatar
      currentProfile = {
        ...currentProfile,
        setting: JSON.stringify(setting),
      }
      return { data: { success: true } }
    })
    await renderPage()
    expect(
      await screen.findByRole('button', { name: 'Upload avatar' })
    ).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Remove avatar' })
    ).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Avatar file'), {
      target: { files: [tinyPng()] },
    })
    expect(
      await screen.findByRole('button', { name: 'Remove avatar' })
    ).toBeVisible()
    await waitFor(() => {
      const setting = useAuthStore.getState().auth.user?.setting
      const record =
        typeof setting === 'string'
          ? (JSON.parse(setting) as { notify_type?: string; avatar?: string })
          : (setting as { notify_type?: string; avatar?: string } | undefined)
      expect(record?.notify_type).toBe('email')
      expect(record?.avatar).toMatch(/^data:image\/png;base64,/)
    })
  })

  it('keeps the new avatar on the card when the refreshed profile is still old', async () => {
    stubAvatarFileReader()
    vi.spyOn(api, 'put').mockResolvedValue({ data: { success: true } })
    await renderPage()
    expect(
      await screen.findByRole('button', { name: 'Upload avatar' })
    ).toBeVisible()
    fireEvent.change(screen.getByLabelText('Avatar file'), {
      target: { files: [tinyPng()] },
    })
    expect(
      await screen.findByRole('button', { name: 'Remove avatar' })
    ).toBeVisible()
    await waitFor(() => {
      const setting = useAuthStore.getState().auth.user?.setting
      const record = setting as { notify_type?: string; avatar?: string }
      expect(record.notify_type).toBe('email')
      expect(record.avatar).toMatch(/^data:image\/png;base64,/)
    })
  })

  it('Profile no longer mounts preferences, settings or security controls', async () => {
    await renderPage('/profile')
    // This fixture disables the sidebar-settings permission and the check-in
    // calendar, so the profile page intentionally renders no cards: profile
    // settings, language preferences and the identity summary all live in
    // Security & Access now.
    expect(document.querySelector('main')).not.toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Save Settings' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Change Password' })
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Account Bindings')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('switch', { name: 'Record IP Address' })
    ).not.toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalledWith('/api/user/passkey')
    expect(api.get).not.toHaveBeenCalledWith('/api/user/2fa/status')
    expect(api.get).not.toHaveBeenCalledWith('/api/user/sessions')
  })

  it('a failed profile load offers retry before exposing account actions', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: false } })
    const user = userEvent.setup()
    await renderPage()
    expect(await screen.findByText('Failed to load profile')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Delete Account' })
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(
      await screen.findByRole('button', { name: 'Delete Account' })
    ).toBeVisible()
  })
})
