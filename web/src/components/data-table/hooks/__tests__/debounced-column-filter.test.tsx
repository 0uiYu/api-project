import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { useDebouncedColumnFilter } from '../use-debounced-column-filter'

afterEach(() => {
  vi.useRealTimers()
})

it('does not restore a cleared column filter after the debounce catches up', () => {
  vi.useFakeTimers()
  const onChange = vi.fn()
  const { rerender } = renderHook(
    (props: { filters: Array<{ id: string; value: string }> }) =>
      useDebouncedColumnFilter({
        columnFilters: props.filters,
        columnId: 'token',
        onColumnFiltersChange: onChange,
        delay: 500,
      }),
    { initialProps: { filters: [{ id: 'token', value: 'sk-live' }] } }
  )

  act(() => {
    vi.advanceTimersByTime(500)
  })
  onChange.mockClear()
  rerender({ filters: [] })
  act(() => {
    vi.advanceTimersByTime(500)
  })

  expect(onChange).not.toHaveBeenCalled()
})

it('does not commit a debounce that resolves in the same turn as reset', () => {
  vi.useFakeTimers()
  const onChange = vi.fn()
  const { result } = renderHook(() =>
    useDebouncedColumnFilter({
      columnFilters: [],
      columnId: 'token',
      onColumnFiltersChange: onChange,
      delay: 500,
    })
  )

  act(() => {
    result.current.setInputValue('sk-live')
  })
  act(() => {
    vi.advanceTimersByTime(500)
    result.current.resetInput()
  })

  expect(result.current.inputValue).toBe('')
  expect(onChange).not.toHaveBeenCalled()
})

it('commits a typed column filter after the debounce', () => {
  vi.useFakeTimers()
  const onChange = vi.fn()
  const { result } = renderHook(() =>
    useDebouncedColumnFilter({
      columnFilters: [],
      columnId: 'token',
      onColumnFiltersChange: onChange,
      delay: 500,
    })
  )

  act(() => {
    result.current.setInputValue('sk-live')
  })
  expect(onChange).not.toHaveBeenCalled()
  act(() => {
    vi.advanceTimersByTime(500)
  })

  expect(onChange).toHaveBeenCalledOnce()
  const updater = onChange.mock.calls[0][0] as (
    previous: Array<{ id: string; value: string }>
  ) => Array<{ id: string; value: string }>
  expect(updater([])).toEqual([{ id: 'token', value: 'sk-live' }])
})
