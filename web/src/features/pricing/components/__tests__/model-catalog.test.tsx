import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PricingModel } from '../../types'
import { ModelCatalog } from '../model-catalog'

const MODEL: PricingModel = {
  id: 1,
  model_name: 'catalog-model',
  vendor_name: 'Vendor A',
  quota_type: 0,
  model_ratio: 1,
  completion_ratio: 2,
  cache_ratio: 0.5,
  enable_groups: ['default'],
  supported_endpoint_types: ['openai'],
}

const DEFAULT_GROUP = { default: { desc: 'Default', ratio: 1 } }

function renderCatalog(options: {
  expandedModelName?: string | null
  usableGroup?: Record<string, { desc: string; ratio: number }>
  onToggle?: (name: string) => void
} = {}) {
  return render(
    <ModelCatalog
      models={[MODEL]}
      expandedModelName={options.expandedModelName ?? null}
      onToggle={options.onToggle ?? (() => {})}
      tokenUnit='M'
      showRechargePrice={false}
      priceRate={1}
      usdExchangeRate={1}
      usableGroup={options.usableGroup ?? DEFAULT_GROUP}
    />
  )
}

afterEach(() => {
  cleanup()
})

describe('user-portal model catalog card', () => {
  it('shows name, provider, capability, availability and both prices', () => {
    renderCatalog()

    expect(screen.getByText('catalog-model')).toBeVisible()
    expect(screen.getByText('Vendor A')).toBeVisible()
    expect(screen.getByText('Chat')).toBeVisible()
    expect(screen.getByText('Available')).toBeVisible()
    expect(screen.getByText('Input')).toBeVisible()
    expect(screen.getByText('Output')).toBeVisible()
  })

  it('folds endpoint type, cache price and billing mode into the details', () => {
    renderCatalog()

    expect(screen.queryByText('Endpoint Type')).not.toBeInTheDocument()
    expect(screen.queryByText('Cache price')).not.toBeInTheDocument()
    expect(screen.queryByText('Billing mode')).not.toBeInTheDocument()
  })

  it('reveals the details for the expanded card only', () => {
    renderCatalog({ expandedModelName: 'catalog-model' })

    expect(screen.getByText('Endpoint Type')).toBeVisible()
    expect(screen.getByText('Cache price')).toBeVisible()
    expect(screen.getByText('Billing mode')).toBeVisible()
  })

  it('reports a model the account cannot call as unavailable', () => {
    renderCatalog({
      usableGroup: { other: { desc: 'Other', ratio: 1 } },
    })

    expect(screen.getByText('Unavailable')).toBeVisible()
  })

  it('asks the page to expand the card that was clicked', () => {
    const onToggle = vi.fn()
    renderCatalog({ onToggle })

    fireEvent.click(screen.getByRole('button', { expanded: false }))

    expect(onToggle).toHaveBeenCalledWith('catalog-model')
  })
})
