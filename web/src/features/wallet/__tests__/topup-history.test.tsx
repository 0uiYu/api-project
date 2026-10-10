import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'

import { Wallet } from '..'

type Download = { filename: string; blob: Blob }

function captureDownloads() {
  const downloads: Download[] = []
  let currentBlob: Blob
  vi.stubGlobal(
    'URL',
    Object.assign(class extends URL {}, {
      createObjectURL: vi.fn((blob: Blob) => {
        currentBlob = blob
        return 'blob:topup-history'
      }),
      revokeObjectURL: vi.fn(),
    })
  )
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
    function (this: HTMLAnchorElement) {
      downloads.push({ filename: this.download, blob: currentBlob })
    }
  )
  return downloads
}

function readDownload(download: Download): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result)), {
      once: true,
    })
    reader.addEventListener('error', () => reject(reader.error), { once: true })
    reader.readAsText(download.blob)
  })
}

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
            topup_link: 'https://shop.example.com/buy',
          },
        },
      }
    }
    if (url.startsWith('/api/user/topup/self')) {
      return {
        data: {
          success: true,
          data: {
            total: 1,
            items: [
              {
                id: 1,
                user_id: 1,
                amount: 10,
                money: 10,
                trade_no: 'ORDER-1',
                payment_method: 'redemption',
                create_time: 1767225600,
                status: 'success',
              },
            ],
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
  vi.unstubAllGlobals()
})

function renderWallet() {
  return render(
    <QueryClientProvider client={client}>
      <Wallet />
    </QueryClientProvider>
  )
}

describe('wallet purchase and topup history', () => {
  it('sends the buy quota button to the configured purchase link', async () => {
    renderWallet()

    expect(
      await screen.findByRole('button', { name: /Buy quota/ })
    ).toHaveAttribute('href', 'https://shop.example.com/buy')
  })

  it('lists topup records and exports them as a spreadsheet file', async () => {
    const downloads = captureDownloads()
    const user = userEvent.setup()
    renderWallet()

    await user.click(
      await screen.findByRole('button', { name: 'Topup history' })
    )
    expect(await screen.findByText('ORDER-1')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Export Excel' }))
    await waitFor(() => expect(downloads).toHaveLength(1))

    expect(downloads[0].filename).toMatch(/^topup-history-\d+\.csv$/)
    // Excel needs the UTF-8 BOM; FileReader strips it, so read the raw bytes.
    const bytes = new Uint8Array(await downloads[0].blob.arrayBuffer())
    expect([...bytes].slice(0, 3)).toEqual([0xef, 0xbb, 0xbf])

    const content = await readDownload(downloads[0])
    expect(content).toContain(
      'Time,Order number,Payment Method,Amount,Payment,Status'
    )
    expect(content).toContain('ORDER-1')
  })
})
