import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'

import { AffiliateRewardsCard } from '../components/affiliate-rewards-card'
import type { UserWalletData } from '../types'

const user: UserWalletData = {
  id: 1,
  username: 'alice',
  quota: 0,
  group: 'default',
  aff_quota: 500000,
  aff_history_quota: 1000000,
  aff_count: 3,
}

function renderSheet(
  overrides: Partial<Parameters<typeof AffiliateRewardsCard>[0]> = {}
) {
  return render(
    <AffiliateRewardsCard
      user={user}
      affiliateLink='https://example.com/sign-up?aff=ABCD'
      onTransfer={() => {}}
      {...overrides}
    />
  )
}

it('keeps the referral link in the navy panel and the reward figures beside it', () => {
  renderSheet()
  const link = 'https://example.com/sign-up?aff=ABCD'
  const linkPanel = screen
    .getByText(link)
    .closest('[data-slot="affiliate-link"]')
  const figures = screen
    .getByText('Pending')
    .closest('[data-slot="affiliate-figures"]')
  const sheet = screen.getByText(link).closest('[data-slot="affiliate-sheet"]')

  expect(linkPanel).toHaveClass('bg-[#1E3A8A]')
  expect(linkPanel).toContainElement(
    screen.getByRole('button', { name: 'Copy referral link' })
  )
  expect(linkPanel).not.toContainElement(screen.getByText('Pending'))
  expect(figures).toContainElement(screen.getByText('Total Earned'))
  expect(figures).toContainElement(screen.getByText('Invites'))
  expect(screen.queryByText('ABCD')).not.toBeInTheDocument()
  expect(sheet).toHaveClass(
    'lg:grid-cols-[minmax(16rem,0.85fr)_minmax(0,1.15fr)]'
  )
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})

it('offers transfer only when pending rewards can be moved', async () => {
  const onTransfer = vi.fn()
  const view = renderSheet({ onTransfer })
  await userEvent.click(
    screen.getByRole('button', { name: 'Transfer to Balance' })
  )
  expect(onTransfer).toHaveBeenCalledTimes(1)

  view.rerender(
    <AffiliateRewardsCard
      user={{ ...user, aff_quota: 0 }}
      affiliateLink='https://example.com/sign-up?aff=ABCD'
      onTransfer={onTransfer}
    />
  )
  expect(
    screen.queryByRole('button', { name: 'Transfer to Balance' })
  ).not.toBeInTheDocument()
})
