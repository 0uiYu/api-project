import { ArrowUpDown, Check, ChevronDown, RotateCcw, X } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { MonoLabel } from '@/components/console/panel'
import { DataTableViewModeToggle } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

import {
  CAPABILITIES,
  FILTER_ALL,
  MAX_SELECTED_TAGS,
  PRICE_RANGES,
  getCapabilityLabels,
  getPriceRangeLabels,
  getSortLabels,
  type SortOption,
  type ViewMode,
} from '../constants'
import {
  filterByCapability,
  filterByPrice,
  parseTags,
  parseTagFilter,
} from '../lib/filters'
import type { PricingModel, PricingVendor, TokenUnit } from '../types'

export interface PricingToolbarProps {
  simple?: boolean
  // Filters
  vendorFilter: string
  capabilityFilter: string
  priceFilter: string
  groupFilter: string
  tagFilter: string
  onVendorChange: (value: string) => void
  onCapabilityChange: (value: string) => void
  onPriceChange: (value: string) => void
  onGroupChange: (value: string) => void
  onTagChange: (value: string) => void
  vendors: PricingVendor[]
  groups: string[]
  groupRatios?: Record<string, number>
  tags: string[]
  models: PricingModel[]
  hasActiveFilters: boolean
  activeFilterCount: number
  onClearFilters: () => void
  // Display controls
  filteredCount: number
  totalCount?: number
  sortBy: string
  onSortChange: (value: string) => void
  tokenUnit: TokenUnit
  onTokenUnitChange: (value: TokenUnit) => void
  showRechargePrice: boolean
  onRechargePriceChange: (value: boolean) => void
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
}

/** Add or remove one value from a comma-joined filter expression. */
function toggleExpression(
  expression: string,
  value: string,
  max = Number.POSITIVE_INFINITY
): string {
  const current = parseTagFilter(expression)
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value].slice(0, max)
  return next.length > 0 ? next.join(',') : FILTER_ALL
}

function formatGroupRatio(ratio: number | undefined): string | undefined {
  if (ratio == null) return undefined
  const formatted = Number.isInteger(ratio)
    ? ratio.toString()
    : ratio.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
  return `x${formatted}`
}

function FilterMenu(props: {
  label: string
  active?: boolean
  /** Render with the user-portal surface tokens instead of the public skin. */
  portal?: boolean
  children: ReactNode
  contentClassName?: string
}) {
  let triggerClassName =
    'border-[#DCE7F7] bg-card/70 text-[#17243D] hover:border-[#BFD7F5] hover:bg-[#F6FAFF] dark:border-white/10 dark:bg-white/5 dark:text-foreground dark:hover:bg-white/10'
  if (props.portal) {
    triggerClassName =
      'border-[var(--portal-border)] bg-[var(--portal-surface)] text-[var(--portal-text)] hover:border-[var(--portal-brand)]'
  }
  if (props.active) {
    triggerClassName = props.portal
      ? 'border-[var(--portal-brand)] bg-[var(--portal-brand-soft)] text-[var(--portal-text)]'
      : 'border-[#BFD7F5] bg-[#EEF4FF] text-[#1E3A8A] dark:border-white/20 dark:bg-white/10 dark:text-[#BFDBFE]'
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            type='button'
            variant='outline'
            size='sm'
            className={cn(
              'h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs font-medium',
              triggerClassName
            )}
          />
        }
      >
        {props.label}
        <ChevronDown className='size-3.5 opacity-60' aria-hidden='true' />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='start'
        className={cn(
          'max-h-[60vh] w-60 overflow-y-auto',
          props.contentClassName
        )}
      >
        {props.children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FilterChip(props: { label: string; onRemove: () => void }) {
  const { t } = useTranslation()

  return (
    <button
      type='button'
      onClick={props.onRemove}
      title={`${t('Clear')} ${props.label}`}
      aria-label={`${t('Clear')} ${props.label}`}
      className='inline-flex h-6 max-w-full items-center gap-1 rounded-full border border-[#DCE7F7] bg-[#EEF4FF] px-2 font-mono text-[11px] text-[#3B5B93] transition-colors hover:border-[#BFD7F5] dark:border-white/10 dark:bg-white/10 dark:text-[#BFDBFE]'
    >
      <span className='truncate'>{props.label}</span>
      <X className='size-3 shrink-0' aria-hidden='true' />
    </button>
  )
}

/**
 * One horizontal filter bar: search lives with the page, everything that
 * narrows the catalog lives here as dropdowns plus a row of removable chips.
 * Users think in capabilities and price bands, so those replace the upstream
 * endpoint and billing-mode jargon.
 */
export function PricingToolbar(props: PricingToolbarProps) {
  const { t } = useTranslation()
  const sortLabels = getSortLabels(t)
  const capabilityLabels = getCapabilityLabels(t)
  const priceRangeLabels = getPriceRangeLabels(t)

  const selectedVendors = parseTagFilter(props.vendorFilter)
  const selectedCapabilities = parseTagFilter(props.capabilityFilter)
  const selectedTags = parseTagFilter(props.tagFilter)
  const priceActive = props.priceFilter !== FILTER_ALL
  const groupActive = props.groupFilter !== FILTER_ALL

  const counts = useMemo(() => {
    const vendors = new Map<string, number>()
    const capabilities = new Map<string, number>()
    const prices = new Map<string, number>()
    const tags = new Map<string, number>()

    for (const model of props.models) {
      if (model.vendor_name) {
        vendors.set(
          model.vendor_name,
          (vendors.get(model.vendor_name) ?? 0) + 1
        )
      }
      for (const capability of Object.values(CAPABILITIES)) {
        if (filterByCapability([model], capability).length > 0) {
          capabilities.set(capability, (capabilities.get(capability) ?? 0) + 1)
        }
      }
      for (const range of Object.values(PRICE_RANGES)) {
        if (
          filterByPrice(
            [model],
            range,
            props.groupFilter === FILTER_ALL ? undefined : props.groupFilter
          ).length > 0
        ) {
          prices.set(range, (prices.get(range) ?? 0) + 1)
        }
      }
      for (const tag of new Set(
        parseTags(model.tags).map((value) => value.toLowerCase())
      )) {
        tags.set(tag, (tags.get(tag) ?? 0) + 1)
      }
    }

    return { vendors, capabilities, prices, tags }
  }, [props.models, props.groupFilter])

  const chips: { key: string; label: string; onRemove: () => void }[] = []
  for (const vendor of selectedVendors) {
    chips.push({
      key: `vendor:${vendor}`,
      label: vendor,
      onRemove: () =>
        props.onVendorChange(toggleExpression(props.vendorFilter, vendor)),
    })
  }
  for (const capability of selectedCapabilities) {
    chips.push({
      key: `capability:${capability}`,
      label:
        capabilityLabels[capability as keyof typeof capabilityLabels] ??
        capability,
      onRemove: () =>
        props.onCapabilityChange(
          toggleExpression(props.capabilityFilter, capability)
        ),
    })
  }
  if (priceActive) {
    chips.push({
      key: 'price',
      label:
        priceRangeLabels[props.priceFilter as keyof typeof priceRangeLabels] ??
        props.priceFilter,
      onRemove: () => props.onPriceChange(FILTER_ALL),
    })
  }
  if (groupActive) {
    chips.push({
      key: 'group',
      label: props.groupFilter,
      onRemove: () => props.onGroupChange(FILTER_ALL),
    })
  }
  for (const tag of selectedTags) {
    chips.push({
      key: `tag:${tag}`,
      label: `#${tag}`,
      onRemove: () => props.onTagChange(toggleExpression(props.tagFilter, tag)),
    })
  }

  return (
    <div
      className={cn(
        'rounded-2xl border',
        props.simple
          ? 'border-[var(--portal-border)] bg-[var(--portal-surface)]'
          : 'border-border/70 bg-card/60 backdrop-blur-md'
      )}
    >
      <div className='flex flex-wrap items-center gap-2 p-2.5'>
        <FilterMenu
          label={t('Capability')}
          active={selectedCapabilities.length > 0}
          portal={props.simple}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t('Capability')}</DropdownMenuLabel>
            {Object.values(CAPABILITIES).map((capability) => {
              const count = counts.capabilities.get(capability) ?? 0
              const checked = selectedCapabilities.includes(capability)
              return (
                <DropdownMenuCheckboxItem
                  key={capability}
                  checked={checked}
                  disabled={!checked && count === 0}
                  onCheckedChange={() =>
                    props.onCapabilityChange(
                      toggleExpression(props.capabilityFilter, capability)
                    )
                  }
                >
                  <span className='flex-1'>{capabilityLabels[capability]}</span>
                  <span className='text-muted-foreground font-mono text-[11px] tabular-nums'>
                    {count}
                  </span>
                </DropdownMenuCheckboxItem>
              )
            })}
          </DropdownMenuGroup>
        </FilterMenu>

        <FilterMenu
          label={t('Price')}
          active={priceActive}
          portal={props.simple}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t('Price')}</DropdownMenuLabel>
            {Object.values(PRICE_RANGES).map((range) => {
              const count = counts.prices.get(range) ?? 0
              const checked = props.priceFilter === range
              return (
                <DropdownMenuCheckboxItem
                  key={range}
                  checked={checked}
                  disabled={!checked && count === 0}
                  onCheckedChange={() =>
                    props.onPriceChange(checked ? FILTER_ALL : range)
                  }
                >
                  <span className='flex-1'>{priceRangeLabels[range]}</span>
                  <span className='text-muted-foreground font-mono text-[11px] tabular-nums'>
                    {count}
                  </span>
                </DropdownMenuCheckboxItem>
              )
            })}
          </DropdownMenuGroup>
        </FilterMenu>

        <FilterMenu
          label={t('Vendors')}
          active={selectedVendors.length > 0}
          portal={props.simple}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t('Vendors')}</DropdownMenuLabel>
            {props.vendors.map((vendor) => {
              const count = counts.vendors.get(vendor.name) ?? 0
              const checked = selectedVendors.includes(vendor.name)
              return (
                <DropdownMenuCheckboxItem
                  key={vendor.id ?? vendor.name}
                  checked={checked}
                  disabled={!checked && count === 0}
                  onCheckedChange={() =>
                    props.onVendorChange(
                      toggleExpression(props.vendorFilter, vendor.name)
                    )
                  }
                >
                  {vendor.icon && (
                    <span className='shrink-0'>
                      {getLobeIcon(vendor.icon, 14)}
                    </span>
                  )}
                  <span className='min-w-0 flex-1 truncate'>{vendor.name}</span>
                  <span className='text-muted-foreground font-mono text-[11px] tabular-nums'>
                    {count}
                  </span>
                </DropdownMenuCheckboxItem>
              )
            })}
          </DropdownMenuGroup>
        </FilterMenu>

        <FilterMenu
          label={t('More filters')}
          active={groupActive || selectedTags.length > 0}
          portal={props.simple}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t('Groups')}</DropdownMenuLabel>
            {props.groups.map((group) => {
              const checked = props.groupFilter === group
              const ratio = formatGroupRatio(props.groupRatios?.[group])
              return (
                <DropdownMenuCheckboxItem
                  key={group}
                  checked={checked}
                  onCheckedChange={() =>
                    props.onGroupChange(checked ? FILTER_ALL : group)
                  }
                >
                  <span className='min-w-0 flex-1 truncate font-mono text-xs'>
                    {group}
                  </span>
                  {ratio && (
                    <span className='text-muted-foreground font-mono text-[11px]'>
                      {ratio}
                    </span>
                  )}
                </DropdownMenuCheckboxItem>
              )
            })}
          </DropdownMenuGroup>

          {props.tags.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className='flex items-center justify-between gap-2'>
                  <span>{t('Model Tags')}</span>
                  <MonoLabel className='text-muted-foreground/80 text-[10px] normal-case'>
                    {t('Up to {{count}} selected', {
                      count: MAX_SELECTED_TAGS,
                    })}
                  </MonoLabel>
                </DropdownMenuLabel>
                {props.tags.map((tag) => {
                  const count = counts.tags.get(tag.toLowerCase()) ?? 0
                  const checked = selectedTags.includes(tag)
                  return (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={checked}
                      disabled={
                        !checked &&
                        (count === 0 ||
                          selectedTags.length >= MAX_SELECTED_TAGS)
                      }
                      onCheckedChange={() =>
                        props.onTagChange(
                          toggleExpression(
                            props.tagFilter,
                            tag,
                            MAX_SELECTED_TAGS
                          )
                        )
                      }
                    >
                      <span className='min-w-0 flex-1 truncate'>{tag}</span>
                      <span className='text-muted-foreground font-mono text-[11px] tabular-nums'>
                        {count}
                      </span>
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuGroup>
            </>
          )}
        </FilterMenu>

        <div className='ms-auto flex min-w-0 flex-wrap items-center gap-2'>
          <span className='text-muted-foreground font-mono text-xs tabular-nums'>
            {props.filteredCount.toLocaleString()}
            {props.totalCount != null &&
            props.filteredCount !== props.totalCount
              ? ` / ${props.totalCount.toLocaleString()}`
              : ''}{' '}
            {t('models')}
          </span>

          {!props.simple && (
            <>
              <ToggleGroup
                value={[props.showRechargePrice ? 'recharge' : 'standard']}
                onValueChange={(values) => {
                  if (values.length > 0) {
                    props.onRechargePriceChange(values[0] === 'recharge')
                  }
                }}
                variant='outline'
                size='sm'
                aria-label={t('Price display mode')}
              >
                <ToggleGroupItem value='standard'>{t('Standard')}</ToggleGroupItem>
                <ToggleGroupItem value='recharge'>{t('Recharge')}</ToggleGroupItem>
              </ToggleGroup>

              <ToggleGroup
                value={[props.tokenUnit]}
                onValueChange={(values) => {
                  if (values[0] === 'M' || values[0] === 'K') {
                    props.onTokenUnitChange(values[0])
                  }
                }}
                variant='outline'
                size='sm'
                aria-label={t('Token unit')}
              >
                <ToggleGroupItem value='M'>/1M</ToggleGroupItem>
                <ToggleGroupItem value='K'>/1K</ToggleGroupItem>
              </ToggleGroup>
            </>
          )}

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              render={
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-8 gap-1.5 px-3 text-xs'
                />
              }
            >
              <ArrowUpDown className='size-3.5' aria-hidden='true' />
              <span>{sortLabels[props.sortBy as SortOption] || t('Sort')}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-44'>
              <DropdownMenuGroup>
                {Object.entries(sortLabels).map(([value, label]) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => props.onSortChange(value)}
                    className='gap-2'
                  >
                    <Check
                      className={cn(
                        'size-4 shrink-0',
                        props.sortBy === value ? 'opacity-100' : 'opacity-0'
                      )}
                      aria-hidden='true'
                    />
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {!props.simple && (
            <DataTableViewModeToggle
              value={props.viewMode}
              onChange={props.onViewModeChange}
            />
          )}
        </div>
      </div>

      {chips.length > 0 && (
        <div className='border-border/60 flex flex-wrap items-center gap-1.5 border-t px-2.5 py-2'>
          {chips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              onRemove={chip.onRemove}
            />
          ))}
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={props.onClearFilters}
            className='text-muted-foreground hover:text-foreground h-6 gap-1 rounded-full px-2 text-[11px]'
          >
            <RotateCcw className='size-3' aria-hidden='true' />
            {t('Reset')}
          </Button>
        </div>
      )}
    </div>
  )
}
