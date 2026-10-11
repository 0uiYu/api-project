import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'

import { SubscriptionPlansPage } from '../subscription-plans-page'

beforeEach(() => {
  vi.spyOn(api, 'get').mockImplementation(async (url) => {
    if (url === '/api/user/self') {
      return {
        data: {
          success: true,
          data: { id: 1, username: 'alice', quota: 0, group: 'default' },
        },
      }
    }
    if (url === '/api/user/topup/info') {
      return {
        data: {
          success: true,
          data: {
            enable_redemption: false,
            topup_link: '',
            payment_compliance_confirmed: false,
          },
        },
      }
    }
    if (url === '/api/subscription/plans') {
      return { data: { success: true, data: [] } }
    }
    if (url === '/api/subscription/self') {
      return {
        data: {
          success: true,
          data: {
            billing_preference: 'subscription_first',
            subscriptions: [],
            all_subscriptions: [],
          },
        },
      }
    }
    throw new Error(`Unexpected GET ${url}`)
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('shows a contact-administrator notice when the plan catalog is empty', async () => {
  render(<SubscriptionPlansPage />)

  const notice = screen.getByText('To subscribe, contact an administrator.')
  expect(notice.closest('[data-slot="subscription-notice"]')).toHaveClass(
    'bg-[#F4F8FC]'
  )
  expect(
    screen.getByRole('heading', { name: 'Subscription Plans' })
  ).toBeVisible()

  await waitFor(() => {
    expect(document.querySelector('[data-slot="skeleton"]')).toBeNull()
  })
  expect(notice).toBeVisible()
  expect(screen.queryByText('No plans available')).not.toBeInTheDocument()
})
