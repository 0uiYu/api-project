import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { USER_PORTAL_CARD_CLASS } from '@/components/layout'
import { cn } from '@/lib/utils'

import {
  getCapabilityLabels,
  getEndpointTypeLabels,
  type EndpointTypeOption,
} from '../constants'
import {
  getDynamicDisplayGroupRatio,
  hasTaskUsageSchema,
} from '../lib/dynamic-price'
import { getAvailableGroups, getModelCapabilities, isTokenBasedModel } from '../lib/model-helpers'
import { formatPrice, formatRequestPrice } from '../lib/price'
import type { PricingModel, TokenUnit } from '../types'

interface ModelCatalogProps {
  models: PricingModel[]
  /** Model name whose row is expanded, if any. */
  expandedModelName: string | null
  onToggle: (modelName: string) => void
  tokenUnit: TokenUnit
  showRechargePrice: boolean
  priceRate: number
  usdExchangeRate: number
  selectedGroup?: string
  /** Groups the viewer may call; drives the availability chip. */
  usableGroup: Record<string, { desc: string; ratio: number }>
}

function Fact(props: { label: string; children: ReactNode }) {
  return (
    <div className='flex min-w-0 flex-col gap-1'>
      <dt className='text-[11px] text-[var(--portal-muted)]'>{props.label}</dt>
      <dd className='min-w-0 text-xs break-words tabular-nums'>
        {props.children}
      </dd>
    </div>
  )
}

/**
 * Model square as a card grid: what the card shows is what a caller needs to
 * pick a model — name, provider, capability, price and whether the account can
 * use it. Cache price, group multipliers, endpoint types and the billing mode
 * are folded into the expanded detail.
 */
export function ModelCatalog(props: ModelCatalogProps) {
  const { t } = useTranslation()
  const endpointLabels = getEndpointTypeLabels(t)
  const capabilityLabels = getCapabilityLabels(t)
  const hasGroupData = Object.keys(props.usableGroup ?? {}).length > 0

  const priceArgs = [
    props.tokenUnit,
    props.showRechargePrice,
    props.priceRate,
    props.usdExchangeRate,
    props.selectedGroup,
  ] as const

  return (
    <ul className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
      {props.models.map((model) => {
        const expanded = props.expandedModelName === model.model_name
        const tokenBased = isTokenBasedModel(model)
        const taskBased = hasTaskUsageSchema(model)
        const capabilities = getModelCapabilities(model)
        const available =
          getAvailableGroups(model, props.usableGroup ?? {}).length > 0

        const inputPrice = tokenBased
          ? `${formatPrice(model, 'input', ...priceArgs)}/${props.tokenUnit}`
          : formatRequestPrice(
              model,
              props.showRechargePrice,
              props.priceRate,
              props.usdExchangeRate,
              props.selectedGroup
            )
        let outputPrice: string
        if (tokenBased) {
          outputPrice = formatPrice(model, 'output', ...priceArgs)
        } else if (taskBased) {
          outputPrice = t('Task billing')
        } else {
          outputPrice = t('Per Request')
        }
        const cachePrice = tokenBased
          ? formatPrice(model, 'cache', ...priceArgs)
          : null

        const groups = (model.enable_groups ?? []).filter(
          (group) => group && group !== 'auto'
        )
        const groupLine = groups.length
          ? groups
              .map(
                (group) =>
                  `${group} ×${getDynamicDisplayGroupRatio(model, group)}`
              )
              .join(' · ')
          : '-'

        const endpoints = (model.supported_endpoint_types ?? []).map(
          (endpoint) =>
            endpointLabels[endpoint as EndpointTypeOption] ?? endpoint
        )

        let billingModeLabel = t('Per Request')
        if (taskBased) {
          billingModeLabel = t('Task billing')
        } else if (tokenBased) {
          billingModeLabel = t('Token billing')
        }

        return (
          <li
            key={model.id ?? model.model_name}
            className='flex min-w-0 flex-col'
          >
            <button
              type='button'
              onClick={() => props.onToggle(model.model_name)}
              aria-expanded={expanded}
              className={cn(
                USER_PORTAL_CARD_CLASS,
                'flex w-full min-w-0 flex-1 flex-col gap-3 text-left transition-colors',
                expanded
                  ? 'border-[var(--portal-brand)]'
                  : 'hover:border-[var(--portal-brand)]'
              )}
            >
              <span className='flex min-w-0 items-start justify-between gap-3'>
                <span className='min-w-0'>
                  <span className='block truncate text-sm font-semibold' title={model.model_name}>
                    {model.model_name}
                  </span>
                  <span className='mt-1 block truncate text-xs text-[var(--portal-muted)]'>
                    {model.vendor_name ?? t('Available model')}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    'size-4 shrink-0 text-[var(--portal-muted)] transition-transform',
                    expanded && 'rotate-180'
                  )}
                  aria-hidden='true'
                />
              </span>

              <span className='flex flex-wrap gap-1.5'>
                {hasGroupData ? (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px]',
                      available
                        ? 'bg-[var(--portal-brand-soft)] text-[var(--portal-text)]'
                        : 'bg-muted text-[var(--portal-muted)]'
                    )}
                  >
                    {available ? t('Available') : t('Unavailable')}
                  </span>
                ) : null}
                {capabilities.map((capability) => (
                  <span
                    key={capability}
                    className='rounded-full border border-[var(--portal-border)] px-2 py-0.5 text-[11px] text-[var(--portal-muted)]'
                  >
                    {capabilityLabels[capability]}
                  </span>
                ))}
              </span>

              <span className='mt-auto flex items-end justify-between gap-3 border-t border-[var(--portal-border)] pt-3'>
                <span>
                  <span className='block text-[11px] text-[var(--portal-muted)]'>
                    {t('Input')}
                  </span>
                  <span className='text-base font-semibold tabular-nums'>
                    {inputPrice}
                  </span>
                </span>
                <span className='text-right'>
                  <span className='block text-[11px] text-[var(--portal-muted)]'>
                    {t('Output')}
                  </span>
                  <span className='text-base font-semibold tabular-nums'>
                    {outputPrice}
                  </span>
                </span>
              </span>
            </button>

            {expanded ? (
              <div className='mt-2 rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-[22px]'>
                <dl className='grid gap-4 sm:grid-cols-2'>
                  {cachePrice ? (
                    <Fact label={t('Cache price')}>{cachePrice}</Fact>
                  ) : null}
                  <Fact label={t('Groups')}>{groupLine}</Fact>
                  <Fact label={t('Endpoint Type')}>
                    {endpoints.length > 0 ? endpoints.join(' · ') : '-'}
                  </Fact>
                  <Fact label={t('Billing mode')}>{billingModeLabel}</Fact>
                </dl>
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
