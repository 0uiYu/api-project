import { describe, expect, test } from 'vitest'

import {
  convertDetectedLanguage,
  normalizeInterfaceLanguage,
  toIntlLocale,
} from './languages'

describe('convertDetectedLanguage', () => {
  test('maps every Chinese browser tag onto Simplified Chinese', () => {
    expect(convertDetectedLanguage('zh-TW')).toBe('zhCN')
    expect(convertDetectedLanguage('zh-HK')).toBe('zhCN')
    expect(convertDetectedLanguage('zh-Hant-TW')).toBe('zhCN')
    expect(convertDetectedLanguage('zh')).toBe('zhCN')
    expect(convertDetectedLanguage('zh-CN')).toBe('zhCN')
  })

  test('keeps the interface codes stable across the localStorage round-trip', () => {
    // i18next caches `zhCN`/`en` to localStorage and the detector runs this
    // converter on the cached value at every page load.
    expect(convertDetectedLanguage('zhCN')).toBe('zhCN')
    expect(convertDetectedLanguage('en')).toBe('en')
  })

  test('passes non-Chinese values through so i18next falls back to English', () => {
    expect(convertDetectedLanguage('en-US')).toBe('en-US')
    expect(convertDetectedLanguage('fr-FR')).toBe('fr-FR')
    expect(convertDetectedLanguage('ja')).toBe('ja')
  })
})

describe('normalizeInterfaceLanguage', () => {
  test('collapses every Chinese variant onto zhCN', () => {
    expect(normalizeInterfaceLanguage('zh-TW')).toBe('zhCN')
    expect(normalizeInterfaceLanguage('zhTW')).toBe('zhCN')
    expect(normalizeInterfaceLanguage('zh_cn')).toBe('zhCN')
  })

  test('resolves a language this build no longer ships to English', () => {
    expect(normalizeInterfaceLanguage('fr')).toBe('en')
    expect(normalizeInterfaceLanguage('ja')).toBe('en')
    expect(normalizeInterfaceLanguage(undefined)).toBe('en')
  })
})

describe('toIntlLocale', () => {
  test('converts the interface code into a valid BCP-47 tag', () => {
    expect(toIntlLocale('zhCN')).toBe('zh-CN')
    expect(toIntlLocale('en')).toBe('en')
  })

  test('returns undefined for values Intl cannot accept', () => {
    expect(toIntlLocale('zhTW')).toBeUndefined()
    expect(toIntlLocale('')).toBeUndefined()
  })
})
