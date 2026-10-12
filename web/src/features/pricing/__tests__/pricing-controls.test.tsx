import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  PricingToolbar,
  type PricingToolbarProps,
} from '../components/pricing-toolbar'
import { filterByCapability, filterByPrice } from '../lib/filters'
import type { PricingModel } from '../types'

function toolbarProps(): PricingToolbarProps {
  return {
    filteredCount: 2,
    totalCount: 2,
    sortBy: 'name',
    tokenUnit: 'M',
    showRechargePrice: false,
    viewMode: 'card',
    capabilityFilter: 'all',
    priceFilter: 'all',
    vendorFilter: 'all',
    groupFilter: 'all',
    tagFilter: 'all',
    onSortChange: vi.fn(),
    onTokenUnitChange: vi.fn(),
    onRechargePriceChange: vi.fn(),
    onViewModeChange: vi.fn(),
    onCapabilityChange: vi.fn(),
    onPriceChange: vi.fn(),
    onVendorChange: vi.fn(),
    onGroupChange: vi.fn(),
    onTagChange: vi.fn(),
    vendors: [
      { id: 1, name: 'Vendor A' },
      { id: 2, name: 'Vendor B' },
    ],
    groups: ['default', 'premium'],
    groupRatios: { default: 1, premium: 3 },
    tags: ['chat', 'image', 'video', 'audio'],
    models: [
      {
        id: 1,
        model_name: 'text-model',
        vendor_name: 'Vendor A',
        quota_type: 0,
        model_ratio: 1,
        completion_ratio: 1,
        enable_groups: ['default'],
        tags: 'chat,image,video,audio',
        supported_endpoint_types: ['openai'],
      },
      {
        id: 2,
        model_name: 'image-model',
        vendor_name: 'Vendor B',
        quota_type: 0,
        model_ratio: 40,
        completion_ratio: 1,
        enable_groups: ['premium'],
        tags: 'image',
        supported_endpoint_types: ['image-generation'],
      },
    ],
    hasActiveFilters: false,
    activeFilterCount: 0,
    onClearFilters: vi.fn(),
  }
}

describe('pricing controls', () => {
  it('selects a capability from the capability menu', async () => {
    const props = toolbarProps()
    const user = userEvent.setup()
    render(<PricingToolbar {...props} />)

    await user.click(screen.getByRole('button', { name: /Capability/ }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: /Image/ }))

    expect(props.onCapabilityChange).toHaveBeenCalledWith('image')
  })

  it('keeps one price band selected at a time', async () => {
    const props = toolbarProps()
    const user = userEvent.setup()
    render(<PricingToolbar {...props} />)

    await user.click(screen.getByRole('button', { name: /^Price/ }))
    await user.click(
      screen.getByRole('menuitemcheckbox', { name: /^> \$20 \/ 1M/ })
    )

    expect(props.onPriceChange).toHaveBeenCalledWith('premium')
  })

  it('adds vendors from the vendor menu', async () => {
    const props = toolbarProps()
    const user = userEvent.setup()
    render(<PricingToolbar {...props} />)

    await user.click(screen.getByRole('button', { name: /Vendors/ }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: /Vendor B/ }))

    expect(props.onVendorChange).toHaveBeenCalledWith('Vendor B')
  })

  it('combines up to three tags from the more menu', async () => {
    const props = toolbarProps()
    const user = userEvent.setup()
    const { rerender } = render(
      <PricingToolbar {...props} tagFilter='chat,image' />
    )

    await user.click(screen.getByRole('button', { name: /More filters/ }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: /^video/ }))
    expect(props.onTagChange).toHaveBeenCalledWith('chat,image,video')

    // Checkbox menus stay open, so the rerendered list is already visible.
    rerender(<PricingToolbar {...props} tagFilter='chat,image,video' />)
    // At the cap the remaining tags are disabled instead of silently ignored.
    expect(
      screen.getByRole('menuitemcheckbox', { name: /^audio/ })
    ).toHaveAttribute('aria-disabled', 'true')
  })

  it('shows each active filter as a removable chip', async () => {
    const props = toolbarProps()
    const user = userEvent.setup()
    render(
      <PricingToolbar
        {...props}
        vendorFilter='Vendor A'
        tagFilter='chat'
        hasActiveFilters
        activeFilterCount={2}
      />
    )

    expect(screen.getByRole('button', { name: 'Clear Vendor A' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Clear #chat' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Clear Vendor A' }))
    expect(props.onVendorChange).toHaveBeenCalledWith('all')

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(props.onClearFilters).toHaveBeenCalledOnce()
  })

  it('disables filter entries with no matching model', async () => {
    const props = toolbarProps()
    const user = userEvent.setup()
    render(<PricingToolbar {...props} />)

    await user.click(screen.getByRole('button', { name: /Capability/ }))
    expect(
      screen.getByRole('menuitemcheckbox', { name: /^Video/ })
    ).toHaveAttribute('aria-disabled', 'true')
    expect(
      screen.getByRole('menuitemcheckbox', { name: /^Image/ })
    ).toBeEnabled()
  })

  it('changes the token unit and keeps the selected unit pressed when clicked again', async () => {
    const props = toolbarProps()
    const user = userEvent.setup()
    const { rerender } = render(<PricingToolbar {...props} />)
    await user.click(screen.getByRole('button', { name: '/1K' }))
    expect(props.onTokenUnitChange).toHaveBeenCalledWith('K')
    rerender(<PricingToolbar {...props} tokenUnit='K' />)
    const selected = screen.getByRole('button', { name: '/1K' })
    expect(selected).toHaveAttribute('aria-pressed', 'true')
    await user.click(selected)
    expect(selected).toHaveAttribute('aria-pressed', 'true')
    expect(props.onTokenUnitChange).toHaveBeenCalledTimes(1)
  })

  it('changes the recharge display mode with an accessible selected state', async () => {
    const props = toolbarProps()
    const user = userEvent.setup()
    const { rerender } = render(<PricingToolbar {...props} />)
    await user.click(screen.getByRole('button', { name: 'Recharge' }))
    expect(props.onRechargePriceChange).toHaveBeenCalledWith(true)
    rerender(<PricingToolbar {...props} showRechargePrice />)
    expect(screen.getByRole('button', { name: 'Recharge' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Standard' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('switches to table view with the keyboard and exposes the selected view', async () => {
    const props = toolbarProps()
    const user = userEvent.setup()
    const { rerender } = render(<PricingToolbar {...props} />)
    const tableButton = screen.getByRole('button', { name: 'Table view' })
    tableButton.focus()
    await user.keyboard('{Enter}')
    expect(props.onViewModeChange).toHaveBeenCalledWith('table')
    rerender(<PricingToolbar {...props} viewMode='table' />)
    expect(tableButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Card view' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('selects price sorting from the shared dropdown', async () => {
    const props = toolbarProps()
    const user = userEvent.setup()
    render(<PricingToolbar {...props} />)
    await user.click(screen.getByRole('button', { name: 'Name' }))
    await user.click(
      screen.getByRole('menuitem', { name: 'Price: Low to High' })
    )
    expect(props.onSortChange).toHaveBeenCalledWith('price-low')
  })
})

describe('capability and price filters', () => {
  const models = [
    {
      id: 1,
      model_name: 'chat-model',
      quota_type: 0,
      model_ratio: 1,
      completion_ratio: 1,
      enable_groups: [],
      supported_endpoint_types: ['openai'],
    },
    {
      id: 2,
      model_name: 'image-model',
      quota_type: 0,
      model_ratio: 40,
      completion_ratio: 1,
      enable_groups: [],
      supported_endpoint_types: ['image-generation'],
    },
    {
      id: 3,
      model_name: 'metered-model',
      quota_type: 1,
      model_ratio: 1,
      completion_ratio: 1,
      enable_groups: [],
    },
  ] as PricingModel[]

  it('maps capabilities onto endpoint groups and matches any of them', () => {
    expect(filterByCapability(models, 'chat').map((m) => m.model_name)).toEqual(
      ['chat-model']
    )
    expect(
      filterByCapability(models, 'chat,image').map((m) => m.model_name)
    ).toEqual(['chat-model', 'image-model'])
    expect(filterByCapability(models, 'all')).toHaveLength(3)
  })

  it('buckets token prices per million and keeps metered models separate', () => {
    // model_ratio 1 → $2 / 1M, model_ratio 40 → $80 / 1M.
    expect(filterByPrice(models, 'mid').map((m) => m.model_name)).toEqual([
      'chat-model',
    ])
    expect(filterByPrice(models, 'premium').map((m) => m.model_name)).toEqual([
      'image-model',
    ])
    expect(filterByPrice(models, 'metered').map((m) => m.model_name)).toEqual([
      'metered-model',
    ])
  })
})
