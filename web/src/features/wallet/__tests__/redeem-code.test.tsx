import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'

import { Wallet } from '..'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  vi.spyOn(api, 'get').mockImplementation(async (url) => {
    if (url === '/api/user/self') {
      return {
        data: {
          success: true,
          data: { id: 1, username: 'alice', quota: 12345, group: 'default' },
        },
      }
    }
    if (url === '/api/user/topup/info') {
      return {
        data: {
          success: true,
          data: {
            enable_redemption: true,
            topup_link: 'https://example.com/buy',
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
})

function renderWallet() {
  return render(
    <QueryClientProvider client={client}>
      <Wallet />
    </QueryClientProvider>
  )
}

describe('wallet redemption code topup', () => {
  it('shows only the balance and redemption code cards', async () => {
    renderWallet()

    expect(await screen.findByText('Current Balance')).toBeVisible()
    expect(screen.getByText('Redemption Code')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Redeem' })).toBeVisible()
    expect(
      await screen.findByRole('link', { name: /Get one here/ })
    ).toHaveAttribute('href', 'https://example.com/buy')
  })

  it('submits the entered code and clears the field on success', async () => {
    const user = userEvent.setup()
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { success: true, data: 500 } })
    renderWallet()

    const input = await screen.findByLabelText('Have a Code?')
    await user.type(input, 'CARD-123')
    await user.click(screen.getByRole('button', { name: 'Redeem' }))

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/user/topup', { key: 'CARD-123' })
    )
    await waitFor(() => expect(input).toHaveValue(''))
  })

  it('does not call the API when the field is empty', async () => {
    const user = userEvent.setup()
    const post = vi.spyOn(api, 'post')
    renderWallet()

    await user.click(await screen.findByRole('button', { name: 'Redeem' }))

    expect(post).not.toHaveBeenCalled()
  })
})
