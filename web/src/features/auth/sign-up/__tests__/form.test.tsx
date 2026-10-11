import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'

import { SignUpForm } from '../components/sign-up-form'

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
  vi.restoreAllMocks()
})

async function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['status'], {
    email_verification: false,
    user_agreement_enabled: false,
    privacy_policy_enabled: false,
    turnstile_check: false,
    oauth_register_enabled: false,
  })
  const root = createRootRoute()
  const signUp = createRoute({
    getParentRoute: () => root,
    path: '/sign-up',
    component: SignUpForm,
  })
  const signIn = createRoute({
    getParentRoute: () => root,
    path: '/sign-in',
    component: () => null,
  })
  const router = createRouter({
    routeTree: root.addChildren([signUp, signIn]),
    history: createMemoryHistory({ initialEntries: ['/sign-up'] }),
  })
  await router.load()
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe('sign-up form', () => {
  it('asks for email, password, confirmation and a verification code', async () => {
    await renderForm()
    const email = await screen.findByLabelText('Email')
    const password = screen.getByLabelText('Password')
    const confirmPassword = screen.getByLabelText('Confirm password')
    const code = screen.getByLabelText('Verification code')
    expect(
      email.compareDocumentPosition(password) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      password.compareDocumentPosition(confirmPassword) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      confirmPassword.compareDocumentPosition(code) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Send code' })).toBeVisible()
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Enter your username')
    ).not.toBeInTheDocument()
  })

  it('rejects a confirmation that does not match the password', async () => {
    const user = userEvent.setup()
    const post = vi.spyOn(api, 'post')
    await renderForm()
    await user.type(await screen.findByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'correct-horse')
    await user.type(
      screen.getByLabelText('Confirm password'),
      'different-horse'
    )
    await user.type(screen.getByLabelText('Verification code'), '24681357')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText("Passwords don't match.")).toBeVisible()
    expect(post).not.toHaveBeenCalled()
  })

  it('submits the email as the account name together with the verification code', async () => {
    const user = userEvent.setup()
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: { success: true },
    })
    await renderForm()
    await user.type(await screen.findByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'correct-horse')
    await user.type(screen.getByLabelText('Confirm password'), 'correct-horse')
    await user.type(screen.getByLabelText('Verification code'), '24681357')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => expect(post).toHaveBeenCalled())
    expect(post).toHaveBeenCalledWith(
      '/api/user/register',
      {
        username: 'ada@example.com',
        email: 'ada@example.com',
        password: 'correct-horse',
        verification_code: '24681357',
        aff_code: '',
        turnstile: '',
      },
      expect.objectContaining({
        params: { turnstile: '' },
      })
    )
  })
})
