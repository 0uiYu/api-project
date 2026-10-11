import { ChevronRight } from 'lucide-react'
import { memo, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'
import { useSystemConfigStore } from '@/stores/system-config-store'

import { DEFAULT_TOKEN_UNIT } from '../constants'
import { useBillingTime } from '../hooks/use-billing-time'
import {
  getCardExamplePrice,
  getDynamicDisplayGroupRatio,
  getDynamicPriceUnitLabelKey,
  getDynamicPricingSummary,
  isUnconfiguredTaskUsageModel,
} from '../lib/dynamic-price'
import { parseTags } from '../lib/filters'
import { isTokenBasedModel } from '../lib/model-helpers'
import { formatPrice, formatRequestPrice } from '../lib/price'
import { taskPriceLabel, taskUsageUnitLabel } from '../lib/task-price-display'
import type { PricingModel, PriceType, TokenUnit } from '../types'
import { ModelBillingModeBadge } from './model-billing-mode-badge'
import { ModelPerfBadge, type ModelPerfBadgeData } from './model-perf-badge'

export interface ModelCardProps {
  model: PricingModel
  onClick: (modelName: string) => void
  priceRate?: number
  usdExchangeRate?: number
  tokenUnit?: TokenUnit
  showRechargePrice?: boolean
  selectedGroup?: string
  perf?: ModelPerfBadgeData
  /** Billing and routing details stay on the admin view. */
  showDetails?: boolean
}

export const ModelCard = memo(function ModelCard(props: ModelCardProps) {
  const { t, i18n } = useTranslation()
  const tokenUnit = props.tokenUnit ?? DEFAULT_TOKEN_UNIT
  const priceRate = props.priceRate ?? 1
  const usdExchangeRate = props.usdExchangeRate ?? 1
  const showRechargePrice = props.showRechargePrice ?? false
  const isTokenBased = isTokenBasedModel(props.model)
  const tokenUnitLabel = tokenUnit === 'K' ? '1K' : '1M'
  const tags = parseTags(props.model.tags)
  const groups = props.model.enable_groups || []
  const endpoints = props.model.supported_endpoint_types || []
  const modelIconKey = props.model.icon || props.model.vendor_icon
  const modelIcon = modelIconKey ? getLobeIcon(modelIconKey, 28) : null
  const initial = props.model.model_name?.charAt(0).toUpperCase() || '?'
  const isUnconfiguredTaskUsage = isUnconfiguredTaskUsageModel(props.model)
  const billingTime = useBillingTime(props.model.billing_expr)
  const currency = useSystemConfigStore((state) => state.config.currency)
  const dynamicPriceOptions = useMemo(
    () => ({
      now: billingTime === undefined ? undefined : new Date(billingTime),
      tokenUnit,
      showRechargePrice,
      priceRate,
      usdExchangeRate,
      groupRatioMultiplier: getDynamicDisplayGroupRatio(
        props.model,
        props.selectedGroup
      ),
    }),
    [
      props.model,
      props.selectedGroup,
      billingTime,
      tokenUnit,
      showRechargePrice,
      priceRate,
      usdExchangeRate,
    ]
  )
  const dynamicSummary = useMemo(
    () => getDynamicPricingSummary(props.model, dynamicPriceOptions),
    // Currency is read indirectly by the price formatter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.model, dynamicPriceOptions, currency]
  )
  const cardExamplePrice = useMemo(
    () => getCardExamplePrice(props.model, dynamicPriceOptions),
    // Currency is read indirectly by the price formatter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.model, dynamicPriceOptions, currency]
  )
  let priceSummary: ReactNode
  if (dynamicSummary) {
    if (dynamicSummary.isSpecialExpression) {
      priceSummary = (
        <div className='col-span-full min-w-0'>
          <span className='text-warning'>
            {t('Special billing expression')}
          </span>
          <code className='mt-1 line-clamp-2 block font-mono text-xs break-all text-[#64748B]'>
            {dynamicSummary.rawExpression}
          </code>
        </div>
      )
    } else if (dynamicSummary.primaryEntries.length > 0) {
      priceSummary = (
        <>
          {dynamicSummary.primaryEntries
            .slice(0, dynamicSummary.providerCount ? 2 : undefined)
            .map((entry) => {
              const unitLabelKey = getDynamicPriceUnitLabelKey(entry)
              const unitLabel = taskUsageUnitLabel(
                entry,
                i18n.language,
                unitLabelKey ? t(unitLabelKey) : tokenUnitLabel
              )
              let label: ReactNode = null
              if (entry.labelKind !== 'schema') {
                label = t(entry.shortLabel)
              } else {
                label = taskPriceLabel(
                  entry.description,
                  entry.shortLabel,
                  i18n.language
                )
              }
              return (
                <div
                  key={entry.key}
                  className={cn(
                    'flex min-w-0 flex-col gap-1',
                    dynamicSummary.isTaskUsage && 'col-span-full'
                  )}
                >
                  {label && (
                    <span className='text-xs break-words whitespace-normal text-[#64748B]'>
                      {label}
                    </span>
                  )}
                  <span className='flex flex-wrap items-baseline gap-x-1 font-mono text-base font-semibold tabular-nums'>
                    <span>{entry.formattedRange ?? entry.formatted}</span>
                    <span className='text-xs font-normal whitespace-nowrap text-[#64748B]'>
                      {' '}
                      / {unitLabel}
                    </span>
                  </span>
                </div>
              )
            })}
          {dynamicSummary.isTimePricing && (
            <span className='col-span-full text-xs text-[#64748B]'>
              {t('Current period price')}
            </span>
          )}
          {dynamicSummary.isMixedBilling && (
            <span className='col-span-full text-xs text-[#64748B]'>
              {t('Token or per-call pricing')}
            </span>
          )}
          {cardExamplePrice && (
            <span className='col-span-full text-xs break-words text-[#64748B]'>
              {cardExamplePrice.label} ≈ {cardExamplePrice.formatted}
            </span>
          )}
          {dynamicSummary.isTaskUsage &&
            dynamicSummary.tier?.label &&
            !dynamicSummary.primaryEntries.some(
              (entry) => entry.formattedRange
            ) && (
              <span className='col-span-full text-xs break-words text-[#64748B]'>
                ({dynamicSummary.tier.label})
              </span>
            )}
        </>
      )
    } else {
      priceSummary = (
        <span className='col-span-full text-[#64748B]'>
          {dynamicSummary.hasUnconfiguredProviders
            ? t('Usage-based billing · price not configured')
            : t('Dynamic Pricing')}
        </span>
      )
    }
  } else if (isUnconfiguredTaskUsage) {
    priceSummary = (
      <span className='col-span-full text-[#64748B]'>
        {t('Usage-based billing · price not configured')}
      </span>
    )
  } else if (isTokenBased) {
    const prices: { type: PriceType; label: string }[] = [
      { type: 'input', label: t('Input') },
      { type: 'output', label: t('Output') },
      ...(props.model.cache_ratio != null
        ? [{ type: 'cache' as const, label: t('Cached') }]
        : []),
    ]
    priceSummary = prices.map((price) => (
      <div key={price.type} className='flex min-w-0 flex-col gap-1'>
        <span className='text-xs text-[#64748B]'>{price.label}</span>
        <span className='font-mono text-base font-semibold tabular-nums'>
          {formatPrice(
            props.model,
            price.type,
            tokenUnit,
            showRechargePrice,
            priceRate,
            usdExchangeRate,
            props.selectedGroup
          )}
          <span className='text-xs font-normal text-[#64748B]'>
            {' '}
            / {tokenUnitLabel}
          </span>
        </span>
      </div>
    ))
  } else {
    priceSummary = (
      <div className='col-span-full flex min-w-0 flex-col gap-1'>
        <span className='font-mono text-base font-semibold tabular-nums'>
          {formatRequestPrice(
            props.model,
            showRechargePrice,
            priceRate,
            usdExchangeRate,
            props.selectedGroup
          )}
          <span className='text-xs font-normal text-[#64748B]'>
            {' '}
            / {t('request')}
          </span>
        </span>
      </div>
    )
  }

  return (
    <Card className='h-full min-w-0 gap-0 overflow-hidden rounded-2xl border border-t-2 border-[#E2E8F0] border-t-[#2563EB] bg-white py-0 text-[#17243D] shadow-[0_18px_36px_-30px_rgba(30,58,138,0.45)] ring-0'>
      <CardHeader className='flex flex-row items-start gap-3 border-b border-[#E7EEF6] bg-[#F4F8FC] px-4 py-3.5 dark:bg-[#F4F8FC]'>
        <div
          aria-hidden
          className='flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#DCE7F7] bg-white'
        >
          {modelIcon || (
            <span className='text-sm font-bold text-[#1E3A8A]'>{initial}</span>
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <h3
            className='line-clamp-2 font-mono text-[15px] leading-snug font-semibold [overflow-wrap:anywhere] text-[#17243D]'
            title={props.model.model_name}
          >
            {props.model.model_name}
          </h3>
          {props.model.vendor_name && (
            <p
              className='mt-1 truncate text-xs text-[#64748B]'
              title={props.model.vendor_name}
            >
              {props.model.vendor_name}
            </p>
          )}
          {tags.length > 0 && (
            <div
              role='group'
              aria-label={t('Tags')}
              className='mt-2 flex min-w-0 items-baseline gap-1.5 text-xs text-[#64748B]'
            >
              <span className='shrink-0'>{t('Tags')}</span>
              <span className='truncate' title={tags.join(', ')}>
                {tags.slice(0, 2).join(', ')}
              </span>
              {tags.length > 2 && (
                <span className='shrink-0' title={tags.slice(2).join(', ')}>
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
        <CopyButton
          value={props.model.model_name}
          tooltip={t('Copy model name')}
          className='size-7 text-[#64748B] hover:bg-white hover:text-[#17243D]'
          iconClassName='size-3.5'
        />
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-3 px-4 py-3.5'>
        <div
          role='group'
          aria-label={t('Pricing')}
          className='flex min-w-0 flex-col gap-2.5'
        >
          <div className='flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1'>
            <ModelBillingModeBadge model={props.model} appearance='caption' />
            {dynamicSummary?.providerCount && (
              <span className='text-xs break-words text-[#64748B]'>
                {t('{{count}} providers', {
                  count: dynamicSummary.providerCount,
                })}
                {dynamicSummary.hasUnconfiguredProviders &&
                  ` · ${t('Not configured for some providers')}`}
              </span>
            )}
          </div>
          <div className='grid grid-cols-[repeat(auto-fit,minmax(88px,1fr))] gap-x-4 gap-y-3 text-[#1E3A8A]'>
            {priceSummary}
          </div>
        </div>
        {(groups.length > 0 || endpoints.length > 0) && (
          <dl
            className={cn(
              'grid min-w-0 grid-cols-2 gap-3 border-t border-[#E7EEF6] pt-3 text-xs',
              (groups.length === 0 || endpoints.length === 0) && 'grid-cols-1'
            )}
          >
            {groups.length > 0 && (
              <div className='flex min-w-0 items-baseline gap-1.5'>
                <dt className='shrink-0 text-[#64748B]'>{t('Groups')}</dt>
                <dd className='flex min-w-0 items-baseline gap-1'>
                  <span className='truncate' title={groups.join(', ')}>
                    {groups[0]}
                  </span>
                  {groups.length > 1 && (
                    <span
                      className='shrink-0 text-[#64748B]'
                      title={groups.slice(1).join(', ')}
                    >
                      +{groups.length - 1}
                    </span>
                  )}
                </dd>
              </div>
            )}
            {endpoints.length > 0 && (
              <div className='flex min-w-0 items-baseline gap-1.5'>
                <dt className='shrink-0 text-[#64748B]'>{t('Endpoints')}</dt>
                <dd className='flex min-w-0 items-baseline gap-1'>
                  <span className='truncate' title={endpoints.join(', ')}>
                    {endpoints.slice(0, 2).join(', ')}
                  </span>
                  {endpoints.length > 2 && (
                    <span
                      className='shrink-0 text-[#64748B]'
                      title={endpoints.slice(2).join(', ')}
                    >
                      +{endpoints.length - 2}
                    </span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        )}
      </CardContent>
      <CardFooter className='mt-auto border-0 bg-[#F8FAFD] px-4 py-3 dark:bg-[#F8FAFD]'>
        <ModelPerfBadge perf={props.perf}>
          {props.showDetails ? (
            <Button
              variant='outline'
              size='sm'
              className='h-7 border-[#DCE7F7] bg-white px-2.5 text-[#2563EB] shadow-none hover:border-[#D7E4F7] hover:bg-white hover:text-[#1D4ED8] dark:border-[#DCE7F7] dark:bg-white dark:text-[#2563EB] dark:hover:border-[#D7E4F7] dark:hover:bg-white dark:hover:text-[#1D4ED8]'
              onClick={() => props.onClick(props.model.model_name || '')}
            >
              {t('Details')}
              <ChevronRight aria-hidden className='size-3.5' />
            </Button>
          ) : null}
        </ModelPerfBadge>
      </CardFooter>
    </Card>
  )
})
