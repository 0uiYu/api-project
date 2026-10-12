import type { TFunction } from 'i18next'

import type { TokenUnit } from './types'

// ----------------------------------------------------------------------------
// Pricing Constants
// ----------------------------------------------------------------------------

/** Sort options for pricing models */
export const SORT_OPTIONS = {
  NAME: 'name',
  PRICE_LOW: 'price-low',
  PRICE_HIGH: 'price-high',
} as const

export type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS]

export function getSortLabels(t: TFunction): Record<SortOption, string> {
  return {
    [SORT_OPTIONS.NAME]: t('Name'),
    [SORT_OPTIONS.PRICE_LOW]: t('Price: Low to High'),
    [SORT_OPTIONS.PRICE_HIGH]: t('Price: High to Low'),
  }
}

/** Filter values */
export const FILTER_ALL = 'all'

/** Quota type options */
export const QUOTA_TYPES = {
  ALL: 'all',
  TOKEN: 'token',
  REQUEST: 'request',
  TASK: 'task',
} as const

export type QuotaTypeOption = (typeof QUOTA_TYPES)[keyof typeof QUOTA_TYPES]

/** Quota type labels */
export function getQuotaTypeLabels(
  t: TFunction
): Record<QuotaTypeOption, string> {
  return {
    [QUOTA_TYPES.ALL]: t('All Models'),
    [QUOTA_TYPES.TOKEN]: t('Token-based'),
    [QUOTA_TYPES.REQUEST]: t('Per Request'),
    [QUOTA_TYPES.TASK]: t('Task billing'),
  }
}

/** Endpoint type options */
export const ENDPOINT_TYPES = {
  ALL: 'all',
  OPENAI: 'openai',
  OPENAI_RESPONSE: 'openai-response',
  ANTHROPIC: 'anthropic',
  GEMINI: 'gemini',
  JINA_RERANK: 'jina-rerank',
  IMAGE_GENERATION: 'image-generation',
  EMBEDDINGS: 'embeddings',
  OPENAI_VIDEO: 'openai-video',
} as const

export type EndpointTypeOption =
  (typeof ENDPOINT_TYPES)[keyof typeof ENDPOINT_TYPES]

/** Endpoint type labels */
export function getEndpointTypeLabels(
  t: TFunction
): Record<EndpointTypeOption, string> {
  return {
    [ENDPOINT_TYPES.ALL]: t('All Types'),
    [ENDPOINT_TYPES.OPENAI]: 'Chat',
    [ENDPOINT_TYPES.OPENAI_RESPONSE]: 'Response',
    [ENDPOINT_TYPES.ANTHROPIC]: 'Anthropic',
    [ENDPOINT_TYPES.GEMINI]: 'Gemini',
    [ENDPOINT_TYPES.JINA_RERANK]: 'Rerank',
    [ENDPOINT_TYPES.IMAGE_GENERATION]: t('Image'),
    [ENDPOINT_TYPES.EMBEDDINGS]: t('Embeddings'),
    [ENDPOINT_TYPES.OPENAI_VIDEO]: t('Video'),
  }
}

/** Filter section keys */
export const FILTER_SECTIONS = {
  PRICING_TYPE: 'pricingType',
  ENDPOINT_TYPE: 'endpointType',
  VENDOR: 'vendor',
  GROUP: 'group',
  TAG: 'tag',
} as const

/**
 * Capability buckets. Users think in tasks ("chat", "image", "video"), not in
 * upstream endpoint identifiers, so the filter exposes these instead of the
 * raw endpoint types.
 */
export const CAPABILITIES = {
  CHAT: 'chat',
  IMAGE: 'image',
  EMBEDDINGS: 'embeddings',
  VIDEO: 'video',
  RERANK: 'rerank',
} as const

export type CapabilityOption = (typeof CAPABILITIES)[keyof typeof CAPABILITIES]

/** Which endpoint types each capability covers. */
export const CAPABILITY_ENDPOINTS: Record<CapabilityOption, string[]> = {
  [CAPABILITIES.CHAT]: [
    ENDPOINT_TYPES.OPENAI,
    ENDPOINT_TYPES.OPENAI_RESPONSE,
    ENDPOINT_TYPES.ANTHROPIC,
    ENDPOINT_TYPES.GEMINI,
  ],
  [CAPABILITIES.IMAGE]: [ENDPOINT_TYPES.IMAGE_GENERATION],
  [CAPABILITIES.EMBEDDINGS]: [ENDPOINT_TYPES.EMBEDDINGS],
  [CAPABILITIES.VIDEO]: [ENDPOINT_TYPES.OPENAI_VIDEO],
  [CAPABILITIES.RERANK]: [ENDPOINT_TYPES.JINA_RERANK],
}

export function getCapabilityLabels(
  t: TFunction
): Record<CapabilityOption, string> {
  return {
    [CAPABILITIES.CHAT]: t('Chat'),
    [CAPABILITIES.IMAGE]: t('Image'),
    [CAPABILITIES.EMBEDDINGS]: t('Embeddings'),
    [CAPABILITIES.VIDEO]: t('Video'),
    [CAPABILITIES.RERANK]: t('Rerank'),
  }
}

/** Price buckets, in USD per 1M input tokens (per call for metered models). */
export const PRICE_RANGES = {
  NO_COST: 'no-cost',
  LOW: 'low',
  MID: 'mid',
  HIGH: 'high',
  PREMIUM: 'premium',
  METERED: 'metered',
} as const

export type PriceRangeOption = (typeof PRICE_RANGES)[keyof typeof PRICE_RANGES]

export function getPriceRangeLabels(
  t: TFunction
): Record<PriceRangeOption, string> {
  return {
    [PRICE_RANGES.NO_COST]: t('No cost'),
    [PRICE_RANGES.LOW]: '≤ $1 / 1M',
    [PRICE_RANGES.MID]: '$1 – $5 / 1M',
    [PRICE_RANGES.HIGH]: '$5 – $20 / 1M',
    [PRICE_RANGES.PREMIUM]: '> $20 / 1M',
    [PRICE_RANGES.METERED]: t('Per request or task'),
  }
}

/** Upper bound (USD per 1M input tokens) for each priced bucket. */
export const PRICE_RANGE_LIMITS: Record<string, number> = {
  [PRICE_RANGES.LOW]: 1,
  [PRICE_RANGES.MID]: 5,
  [PRICE_RANGES.HIGH]: 20,
}

/** Maximum number of tags to display in model row */
export const MAX_TAGS_DISPLAY = 5

/** Maximum number of filter items to display before showing "More..." */
export const MAX_FILTER_ITEMS = 5

/** Tags behave like a light multi-select: enough to combine, not to clog. */
export const MAX_SELECTED_TAGS = 3

/** Sidebar width */
export const SIDEBAR_WIDTH = 'w-64'

/** Excluded groups */
export const EXCLUDED_GROUPS = ['', 'auto']

/** Quota type values */
export const QUOTA_TYPE_VALUES = {
  TOKEN: 0,
  REQUEST: 1,
} as const

/** Token unit divisors */
export const TOKEN_UNIT_DIVISORS = {
  M: 1,
  K: 1000,
} as const

/** Default token unit for pricing display */
export const DEFAULT_TOKEN_UNIT: TokenUnit = 'M'

/** View mode options */
export const VIEW_MODES = {
  CARD: 'card',
  TABLE: 'table',
} as const

export type ViewMode = (typeof VIEW_MODES)[keyof typeof VIEW_MODES]

/** Default page size for pricing table */
export const DEFAULT_PRICING_PAGE_SIZE = 20
