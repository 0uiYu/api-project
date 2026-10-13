import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { FILTER_ALL } from '../constants'
import { parseTagFilter } from '../lib/filters'
import type { PricingVendor } from '../types'

/**
 * The brands a caller is likely to look for, matched against the real vendor
 * list the server returned. A chip only appears when it actually matches a
 * vendor, so the bar never offers a filter that would return nothing.
 */
const BRAND_CHIPS = [
  { id: 'claude', label: 'Claude', pattern: /anthropic|claude/i },
  { id: 'chatgpt', label: 'ChatGPT', pattern: /openai|chatgpt/i },
  { id: 'grok', label: 'Grok', pattern: /xai|grok/i },
  { id: 'gemini', label: 'Gemini', pattern: /google|gemini/i },
] as const

interface PortalModelFiltersProps {
  vendors: PricingVendor[]
  vendorFilter: string
  onVendorChange: (value: string) => void
}

export function PortalModelFilters(props: PortalModelFiltersProps) {
  const { t } = useTranslation()

  const chips = useMemo(() => {
    const names = props.vendors
      .map((vendor) => vendor.name)
      .filter((name): name is string => Boolean(name))
    const brands: { id: string; label: string; names: string[] }[] =
      BRAND_CHIPS.map((chip) => ({
        id: chip.id,
        label: t(chip.label),
        names: names.filter((name) => chip.pattern.test(name)),
      })).filter((chip) => chip.names.length > 0)

    const claimed = new Set(brands.flatMap((chip) => chip.names))
    const others = names.filter((name) => !claimed.has(name))
    if (others.length > 0) {
      brands.push({ id: 'other', label: t('Other'), names: others })
    }
    return brands
  }, [props.vendors, t])

  const selected = useMemo(
    () =>
      new Set(
        props.vendorFilter === FILTER_ALL
          ? []
          : parseTagFilter(props.vendorFilter)
      ),
    [props.vendorFilter]
  )

  const isActive = (names: string[]) =>
    names.length > 0 &&
    selected.size === names.length &&
    names.every((name) => selected.has(name))

  return (
    <div className='flex flex-wrap gap-2'>
        {chips.map((chip) => {
          const active = isActive(chip.names)
          return (
            <button
              key={chip.id}
              type='button'
              aria-pressed={active}
              onClick={() =>
                props.onVendorChange(
                  active ? FILTER_ALL : chip.names.join(',')
                )
              }
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                active
                  ? 'border-[var(--portal-brand)] bg-[var(--portal-brand-soft)] font-medium text-[var(--portal-brand)]'
                  : 'border-[var(--portal-border)] text-[var(--portal-muted)] hover:border-[var(--portal-brand)] hover:text-[var(--portal-text)]'
              )}
            >
              {chip.label}
            </button>
          )
        })}
    </div>
  )
}
