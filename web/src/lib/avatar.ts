import type { CSSProperties } from 'react'

export type UserAvatarStyle = Pick<CSSProperties, 'backgroundColor' | 'color'>

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

export function getUserAvatarStyle(name: string): UserAvatarStyle {
  const hash = hashString(name)
  const hue = hash % 360
  const saturation = 54 + (hash % 8)
  const lightness = 52 + ((hash >> 4) % 8)

  return {
    backgroundColor: `hsl(${hue} ${saturation}% ${lightness}%)`,
    color: 'white',
  }
}

const storedAvatarPattern =
  /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/

export function getStoredUserAvatar(setting: unknown): string | undefined {
  let record: Record<string, unknown> | undefined
  if (typeof setting === 'string') {
    try {
      const parsed: unknown = JSON.parse(setting)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        record = parsed as Record<string, unknown>
      }
    } catch {
      return undefined
    }
  } else if (
    setting &&
    typeof setting === 'object' &&
    !Array.isArray(setting)
  ) {
    record = setting as Record<string, unknown>
  }
  const avatar = record?.avatar
  if (typeof avatar !== 'string' || !storedAvatarPattern.test(avatar)) {
    return undefined
  }
  return avatar
}

export function getUserAvatarFallback(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}
