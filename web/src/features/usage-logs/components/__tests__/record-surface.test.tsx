import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'

import { LogsFilterToolbar } from '../logs-filter-toolbar'

function FilterBand(props: { embedded?: boolean }) {
  const table = useReactTable({
    data: [],
    columns: [],
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <LogsFilterToolbar
      table={table}
      embedded={props.embedded}
      primaryFilters={<span>Model Name</span>}
      stats={<span>Usage</span>}
      hasActiveFilters={false}
      onReset={() => {}}
      onSearch={() => {}}
    />
  )
}

it('keeps desktop usage filters and the usage total in one pale header band', () => {
  render(<FilterBand embedded />)
  const band = screen
    .getByRole('button', { name: 'Search' })
    .closest('[data-slot="usage-filter-band"]')
  expect(band).toHaveClass('bg-[#F4F8FC]', 'border-b')
  expect(band).not.toHaveClass('bg-card/50', 'rounded-lg')
  expect(band).toHaveTextContent('Model Name')
  expect(band).toHaveTextContent('Usage')
})

it('keeps a standalone filter toolbar as its own card', () => {
  const view = render(<FilterBand />)
  const card = view.container.firstElementChild
  expect(card).not.toHaveAttribute('data-slot', 'usage-filter-band')
  expect(card).toHaveClass('bg-card/50', 'rounded-lg', 'border')
  expect(card).toContainElement(screen.getByRole('button', { name: 'Search' }))
})
