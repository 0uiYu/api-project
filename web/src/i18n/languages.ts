/**
 * The interface ships two languages: Simplified Chinese and English. Anything
 * else — including a stored preference for a language an older build offered —
 * resolves to English rather than leaving the UI half-translated.
 */
export const INTERFACE_LANGUAGE_OPTIONS = [
  { code: 'zhCN', label: '简体中文' },
  { code: 'en', label: 'English' },
] as const

export type InterfaceLanguageCode =
  (typeof INTERFACE_LANGUAGE_OPTIONS)[number]['code']

/**
 * Collapse any language value onto one of the two interface codes. Accepts both
 * stored preferences (`zhTW`, `zh-TW`, `fr`) and i18next values (`zhCN`, `en`).
 */
export function normalizeInterfaceLanguage(value?: string | null): string {
  if (!value) return 'en'
  const normalized = value.trim().replaceAll('_', '-').toLowerCase()
  return normalized.startsWith('zh') ? 'zhCN' : 'en'
}

/** Return the canonical interface code used by React components. */
export function getInterfaceLanguage(
  value?: string | null
): InterfaceLanguageCode {
  return normalizeInterfaceLanguage(value) as InterfaceLanguageCode
}

/**
 * Map a browser-detected locale onto the interface language codes this project
 * uses with i18next (`zhCN` / `en`).
 *
 * Browsers report standard BCP-47 tags (`zh-CN`, `zh-TW`, `zh-Hant`, `zh`, ...),
 * so every Chinese tag is mapped onto `zhCN`; otherwise a Chinese browser would
 * fall back to English. Non-Chinese values are returned unchanged so i18next's
 * own `supportedLngs` matching still applies (`en-US` -> `en`, and anything the
 * build does not ship falls back to English).
 */
export function convertDetectedLanguage(value: string): string {
  const lower = value.trim().replaceAll('_', '-').toLowerCase()
  return lower.startsWith('zh') ? 'zhCN' : value
}

/**
 * Convert an interface language code (`zhCN`) into a valid BCP-47 locale tag
 * that the `Intl.*` APIs accept.
 *
 * `new Intl.NumberFormat('zhCN')` throws `RangeError: Invalid language tag`, so
 * any locale derived from `i18n.language` / `i18n.resolvedLanguage` MUST be run
 * through this before it reaches an `Intl` constructor. Unknown or invalid
 * values fall back to `undefined`, which makes `Intl` use the runtime default.
 */
export function toIntlLocale(value?: string | null): string | undefined {
  if (!value) return undefined
  if (value === 'zhCN') return 'zh-CN'
  try {
    return Intl.getCanonicalLocales(value)[0]
  } catch {
    return undefined
  }
}
