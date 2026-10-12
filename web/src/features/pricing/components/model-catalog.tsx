import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { MonoLabel, Panel } from '@/components/console/panel'
import { cn } from '@/lib/utils'

import { getEndpointTypeLabels, type EndpointTypeOption } from '../constants'
import {
  getDynamicDisplayGroupRatio,
  hasTaskUsageSchema,
} from '../lib/dynamic-price'
import { isTokenBasedModel } from '../lib/model-helpers'
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
}

/** Shared grid so the header line and every row line up column for column. */
const ROW_GRID =
  'grid items-center gap-x-3 grid-cols-[minmax(0,1fr)_4.5rem] sm:grid-cols-[minmax(0,1fr)_6.5rem_4.5rem_4.5rem]'

function Fact(props: { label: string; children: ReactNode }) {
  return (
    <div className='min-w-0'>
      <dt>
        <MonoLabel className='text-muted-foreground/80 text-[10px]'>
          {props.label}
        </MonoLabel>
      </dt>
      <dd className='mt-1 min-w-0 truncate'>{props.children}</dd>
    </div>
  )
}

/**
 * Model square as a dense catalog: one line per model, price on the right,
 * details folded into the row itself. No card grid, no side panel, and no
 * performance or upstream-API sections — the catalog is a price list.
 */
export function ModelCatalog(props: ModelCatalogProps) {
  const { t } = useTranslation()
  const endpointLabels = getEndpointTypeLabels(t)

  const priceArgs = [
    props.tokenUnit,
    props.showRechargePrice,
    props.priceRate,
    props.usdExchangeRate,
    props.selectedGroup,
  ] as const

  return (
    <Panel
      label={t('Models')}
      action={
        <MonoLabel className='text-muted-foreground/80 normal-case'>
          {props.models.length}
        </MonoLabel>
      }
    >
      <div
        className={cn(
          ROW_GRID,
          'border-border/60 text-muted-foreground border-b px-3.5 py-1.5'
        )}
      >
        <MonoLabel>{t('Model')}</MonoLabel>
        <MonoLabel className='hidden sm:block'>{t('Vendor')}</MonoLabel>
        <MonoLabel className='text-right'>{t('Input')}</MonoLabel>
        <MonoLabel className='hidden text-right sm:block'>
          {t('Output')}
        </MonoLabel>
      </div>

      <ul className='divide-border/60 divide-y'>
        {props.models.map((model) => {
          const expanded = props.expandedModelName === model.model_name
          const tokenBased = isTokenBasedModel(model)
          const taskBased = hasTaskUsageSchema(model)
          const groups = (model.enable_groups ?? []).filter(
            (group) => group && group !== 'auto'
          )

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
            : '-'

          const groupLine =
            groups.length > 0
              ? groups
                  .slice(0, 4)
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

          return (
            <li key={model.id ?? model.model_name}>
              <button
                type='button'
                onClick={() => props.onToggle(model.model_name)}
                aria-expanded={expanded}
                className={cn(
                  ROW_GRID,
                  'w-full px-3.5 py-2.5 text-left transition-colors',
                  expanded
                    ? 'bg-[#EEF4FF]/70 dark:bg-white/10'
                    : 'hover:bg-[#F6FAFF] dark:hover:bg-white/5'
                )}
              >
                <span className='flex min-w-0 items-center gap-2'>
                  <ChevronDown
                    className={cn(
                      'text-muted-foreground size-3.5 shrink-0 transition-transform',
                      expanded && 'rotate-180'
                    )}
                    aria-hidden='true'
                  />
                  <span
                    className='dark:text-foreground truncate font-mono text-[13px] text-[#17243D]'
                    title={model.model_name}
                  >
                    {model.model_name}
                  </span>
                </span>
                <span className='text-muted-foreground hidden truncate text-xs sm:block'>
                  {model.vendor_name ?? '-'}
                </span>
                <span className='dark:text-foreground text-right font-mono text-xs text-[#17243D] tabular-nums'>
                  {inputPrice}
                </span>
                <span className='text-muted-foreground hidden truncate text-right font-mono text-xs tabular-nums sm:block'>
                  {outputPrice}
                </span>
              </button>

              {expanded && (
                <div className='border-border/60 border-t bg-[#F8FBFF] px-3.5 py-2.5 dark:bg-white/5'>
                  <dl className='grid gap-x-6 gap-y-2 sm:grid-cols-3'>
                    <Fact label={t('Cost')}>
                      <span className='font-mono text-xs'>
                        {tokenBased
                          ? `${inputPrice} · ${outputPrice} · ${cachePrice}`
                          : `${inputPrice} · ${outputPrice}`}
                      </span>
                    </Fact>
                    <Fact label={t('Groups')}>
                      <span className='font-mono text-xs'>{groupLine}</span>
                    </Fact>
                    <Fact label={t('Endpoint Type')}>
                      <span className='font-mono text-xs'>
                        {endpoints.length > 0 ? endpoints.join(' · ') : '-'}
                      </span>
                    </Fact>
                  </dl>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
