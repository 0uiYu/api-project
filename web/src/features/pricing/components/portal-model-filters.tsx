import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { getLobeIcon } from '@/lib/lobe-icon'

import { FILTER_ALL } from '../constants'
import { parseTagFilter } from '../lib/filters'
import type { PricingModel, PricingVendor } from '../types'

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
  models: PricingModel[]
  modelFilter: string
  onModelChange: (value: string) => void
  ratios: string[]
  ratioFilter: string
  onRatioChange: (value: string) => void
}

export function PortalModelFilters(props: PortalModelFiltersProps) {
  const { t } = useTranslation()

  const chips = useMemo(() => {
    const names = props.vendors
      .map((vendor) => vendor.name)
      .filter((name): name is string => Boolean(name))
    const brands: { id: string; label: string; names: string[]; icon?: string }[] =
      BRAND_CHIPS.map((chip) => ({
        id: chip.id,
        label: t(chip.label),
        names: names.filter((name) => chip.pattern.test(name)),
        icon: props.vendors.find((vendor) => chip.pattern.test(vendor.name))?.icon,
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
    <div className='w-full space-y-3'>
      <div className='flex w-full flex-wrap items-center gap-2'>
        <span className='mr-1 self-center text-xs text-[var(--portal-muted)]'>
          {t('Provider')}
        </span>
        <button
          type='button'
          aria-pressed={props.vendorFilter === FILTER_ALL}
          onClick={() => props.onVendorChange(FILTER_ALL)}
          className={cn(
            'inline-flex min-w-24 items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors',
            props.vendorFilter === FILTER_ALL
              ? 'border-[var(--portal-brand)] bg-[var(--portal-brand-soft)] font-medium text-[var(--portal-brand)]'
              : 'border-[var(--portal-border)] text-[var(--portal-muted)] hover:border-[var(--portal-brand)] hover:text-[var(--portal-text)]'
          )}
        >
          {t('All providers')}
        </button>
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
                'inline-flex min-w-28 items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors',
                active
                  ? 'border-[var(--portal-brand)] bg-[var(--portal-brand-soft)] font-medium text-[var(--portal-brand)]'
                  : 'border-[var(--portal-border)] text-[var(--portal-muted)] hover:border-[var(--portal-brand)] hover:text-[var(--portal-text)]'
              )}
            >
              {getLobeIcon(chip.icon, 14)}
              {chip.label}
            </button>
          )
          })}
      </div>
      <div className='flex flex-wrap gap-2'>
        <span className='self-center text-xs text-[var(--portal-muted)]'>{t('Model')}</span>
        <button type='button' onClick={() => props.onModelChange(FILTER_ALL)} className={cn('rounded-full border px-3 py-1 text-xs', props.modelFilter === FILTER_ALL ? 'border-[var(--portal-brand)] bg-[var(--portal-brand-soft)]' : 'border-[var(--portal-border)]')}>
          {t('All models')}
        </button>
        {props.models.map((model) => (
          <button key={model.model_name} type='button' onClick={() => props.onModelChange(props.modelFilter === model.model_name ? FILTER_ALL : model.model_name)} className={cn('inline-flex max-w-52 items-center gap-1.5 truncate rounded-full border px-3 py-1 text-xs', props.modelFilter === model.model_name ? 'border-[var(--portal-brand)] bg-[var(--portal-brand-soft)]' : 'border-[var(--portal-border)]')}>
            {getLobeIcon(model.icon || model.vendor_icon, 14)}
            <span className='truncate'>{model.model_name}</span>
          </button>
        ))}
      </div>
      <div className='flex flex-wrap gap-2'>
        <span className='self-center text-xs text-[var(--portal-muted)]'>{t('Multiplier')}</span>
        <button type='button' onClick={() => props.onRatioChange(FILTER_ALL)} className={cn('rounded-full border px-3 py-1 text-xs', props.ratioFilter === FILTER_ALL ? 'border-[var(--portal-brand)] bg-[var(--portal-brand-soft)]' : 'border-[var(--portal-border)]')}>{t('All')}</button>
        {props.ratios.map((ratio) => (
          <button key={ratio} type='button' onClick={() => props.onRatioChange(props.ratioFilter === ratio ? FILTER_ALL : ratio)} className={cn('rounded-full border px-3 py-1 text-xs', props.ratioFilter === ratio ? 'border-[var(--portal-brand)] bg-[var(--portal-brand-soft)]' : 'border-[var(--portal-border)]')}>{ratio}</button>
        ))}
      </div>
    </div>
  )
}
