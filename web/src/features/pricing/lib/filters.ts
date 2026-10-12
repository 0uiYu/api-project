import {
  SORT_OPTIONS,
  FILTER_ALL,
  QUOTA_TYPES,
  QUOTA_TYPE_VALUES,
  ENDPOINT_TYPES,
  CAPABILITY_ENDPOINTS,
  PRICE_RANGES,
} from '../constants'
import type { PricingModel } from '../types'
import {
  getDynamicDisplayGroupRatio,
  hasTaskUsageSchema,
} from './dynamic-price'
import { getInputPricePerMillion } from './price'

// ----------------------------------------------------------------------------
// Filter Utilities
// ----------------------------------------------------------------------------

/**
 * Filter models by search query
 */
export function filterBySearch(
  models: PricingModel[],
  query: string
): PricingModel[] {
  if (!query) return models

  const lowerQuery = query.toLowerCase()
  return models.filter(
    (m) =>
      m.model_name?.toLowerCase().includes(lowerQuery) ||
      m.description?.toLowerCase().includes(lowerQuery) ||
      m.tags?.toLowerCase().includes(lowerQuery) ||
      m.vendor_name?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Filter models by vendor
 */
export function filterByVendor(
  models: PricingModel[],
  vendor: string
): PricingModel[] {
  const selected = parseTagFilter(vendor)
  if (selected.length === 0) return models
  return models.filter(
    (m) => !!m.vendor_name && selected.includes(m.vendor_name)
  )
}

/**
 * Filter models by group
 */
export function filterByGroup(
  models: PricingModel[],
  group: string
): PricingModel[] {
  if (group === FILTER_ALL) return models
  return models.filter((m) => m.enable_groups?.includes(group))
}

/**
 * Filter models by quota type
 */
export function filterByQuotaType(
  models: PricingModel[],
  quotaType: string
): PricingModel[] {
  if (quotaType === QUOTA_TYPES.ALL) return models
  // Task-usage models form their own bucket, disjoint from token/request.
  if (quotaType === QUOTA_TYPES.TASK) {
    return models.filter((m) => hasTaskUsageSchema(m))
  }
  const targetType =
    quotaType === QUOTA_TYPES.TOKEN
      ? QUOTA_TYPE_VALUES.TOKEN
      : QUOTA_TYPE_VALUES.REQUEST
  return models.filter(
    (m) => m.quota_type === targetType && !hasTaskUsageSchema(m)
  )
}

/**
 * Filter models by endpoint type
 */
export function filterByEndpointType(
  models: PricingModel[],
  endpointType: string
): PricingModel[] {
  if (endpointType === ENDPOINT_TYPES.ALL) return models
  return models.filter((m) =>
    m.supported_endpoint_types?.includes(endpointType)
  )
}

/**
 * Filter by user-facing capability (chat / image / video …), which maps onto
 * one or more upstream endpoint types.
 */
export function filterByCapability(
  models: PricingModel[],
  capability: string
): PricingModel[] {
  const selected = parseTagFilter(capability)
  if (selected.length === 0) return models

  const endpoints = new Set(
    selected.flatMap(
      (value) =>
        CAPABILITY_ENDPOINTS[value as keyof typeof CAPABILITY_ENDPOINTS] ?? []
    )
  )
  if (endpoints.size === 0) return models

  return models.filter((m) =>
    (m.supported_endpoint_types ?? []).some((type) => endpoints.has(type))
  )
}

/**
 * Filter by price bucket, in USD per 1M input tokens. Metered models (per
 * request or task-billed) form their own bucket because their price has no
 * per-token meaning.
 */
export function filterByPrice(
  models: PricingModel[],
  range: string,
  selectedGroup?: string
): PricingModel[] {
  if (!range || range === FILTER_ALL) return models

  return models.filter((model) => {
    const metered =
      model.quota_type !== QUOTA_TYPE_VALUES.TOKEN || hasTaskUsageSchema(model)
    if (range === PRICE_RANGES.METERED) return metered
    if (metered) return false

    const price = getInputPricePerMillion(
      model,
      getDynamicDisplayGroupRatio(model, selectedGroup)
    )
    if (!Number.isFinite(price)) return false

    switch (range) {
      case PRICE_RANGES.NO_COST:
        return price <= 0
      case PRICE_RANGES.LOW:
        return price > 0 && price <= 1
      case PRICE_RANGES.MID:
        return price > 1 && price <= 5
      case PRICE_RANGES.HIGH:
        return price > 5 && price <= 20
      case PRICE_RANGES.PREMIUM:
        return price > 20
      default:
        return true
    }
  })
}

/**
 * Get model price for sorting
 */
function getModelPrice(model: PricingModel): number {
  return model.quota_type === 0 ? model.model_ratio : model.model_price || 0
}

/**
 * Sort models by specified option
 */
export function sortModels(
  models: PricingModel[],
  sortBy: string
): PricingModel[] {
  const sorted = [...models]

  switch (sortBy) {
    case SORT_OPTIONS.NAME:
      sorted.sort((a, b) =>
        (a.model_name || '').localeCompare(b.model_name || '')
      )
      break
    case SORT_OPTIONS.PRICE_LOW:
      sorted.sort((a, b) => getModelPrice(a) - getModelPrice(b))
      break
    case SORT_OPTIONS.PRICE_HIGH:
      sorted.sort((a, b) => getModelPrice(b) - getModelPrice(a))
      break
  }

  return sorted
}

/**
 * Apply all filters and sorting to models
 */
export function filterAndSortModels(
  models: PricingModel[],
  filters: {
    search: string
    vendor: string
    group: string
    capability: string
    price: string
    tag: string
    sortBy: string
    selectedGroup?: string
  }
): PricingModel[] {
  let result = filterBySearch(models, filters.search)
  result = filterByVendor(result, filters.vendor)
  result = filterByGroup(result, filters.group)
  result = filterByCapability(result, filters.capability)
  result = filterByPrice(result, filters.price, filters.selectedGroup)
  result = filterByTag(result, filters.tag)
  result = sortModels(result, filters.sortBy)

  return result
}

/**
 * Parse tags from comma-separated string
 */
export function parseTags(tagsString?: string): string[] {
  if (!tagsString) return []
  return tagsString
    .split(/[,;|\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
}

/**
 * Extract all unique tags from models
 */
export function extractAllTags(models: PricingModel[]): string[] {
  const tagSet = new Set<string>()

  models.forEach((model) => {
    if (model.tags) {
      const tags = parseTags(model.tags)
      tags.forEach((tag) => {
        tagSet.add(tag.toLowerCase())
      })
    }
  })

  return [...tagSet].sort((a, b) => a.localeCompare(b))
}

/**
 * Split the comma-joined tag expression carried by the search params.
 */
export function parseTagFilter(value: string): string[] {
  if (!value || value === FILTER_ALL) return []
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

/**
 * Filter models by tag. The expression may hold several tags; a model matches
 * when it carries any of them.
 */
export function filterByTag(
  models: PricingModel[],
  tag: string
): PricingModel[] {
  const selected = new Set(
    parseTagFilter(tag).map((value) => value.toLowerCase())
  )
  if (selected.size === 0) return models

  return models.filter((m) => {
    if (!m.tags) return false
    return parseTags(m.tags).some((value) => selected.has(value.toLowerCase()))
  })
}
