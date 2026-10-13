import { ImageUp, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { USER_PORTAL_CARD_CLASS } from '@/components/layout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { updateUserProfile } from '@/features/profile/api'
import {
  AvatarImageError,
  prepareAvatarDataUrl,
} from '@/features/profile/lib/avatar-image'
import {
  getStoredUserAvatar,
  getUserAvatarFallback,
  getUserAvatarStyle,
} from '@/lib/avatar'
import { handleServerError } from '@/lib/handle-server-error'
import { useAuthStore } from '@/stores/auth-store'

import { getDisplayName } from '../lib'
import type { UserProfile } from '../types'

// ============================================================================
// Profile Header Component
// ============================================================================

interface ProfileHeaderProps {
  profile: UserProfile | null
  loading: boolean
  onUpdate?: () => void | Promise<void>
}

export function ProfileHeader(props: ProfileHeaderProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null)
  const profile = props.profile
  const loading = props.loading

  useEffect(() => {
    if (avatarOverride === null || !profile) return
    const stored = getStoredUserAvatar(profile.setting)
    const expected = avatarOverride || undefined
    if (stored !== expected) return
    const current = useAuthStore.getState().auth.user
    if (current) {
      useAuthStore.getState().auth.setUser({
        ...current,
        setting: profile.setting,
      })
    }
    setAvatarOverride(null)
  }, [avatarOverride, profile])

  if (loading) {
    return (
      <div
        data-slot='profile-identity'
        className='flex items-center gap-4 border-b border-[#E7EEF6] bg-[#F4F8FC] px-4 py-5 sm:px-6'
      >
        <Skeleton className='size-14 rounded-2xl bg-[#E2E8F0]' />
        <div className='flex flex-col gap-2'>
          <Skeleton className='h-6 w-40 bg-[#E2E8F0]' />
          <Skeleton className='h-4 w-56 bg-[#E2E8F0]' />
        </div>
      </div>
    )
  }

  if (!profile) return null

  const displayName = getDisplayName(profile)
  const avatarName = profile.username || displayName
  const avatarFallback = getUserAvatarFallback(avatarName)
  const avatarFallbackStyle = getUserAvatarStyle(avatarName)
  const storedAvatar = getStoredUserAvatar(profile.setting)
  const avatar =
    avatarOverride === null ? storedAvatar : avatarOverride || undefined
  const saveAvatar = async (nextAvatar: string) => {
    setUploading(true)
    try {
      const response = await updateUserProfile({ avatar: nextAvatar })
      if (!response.success) {
        handleServerError(response, t('Failed to update profile'))
        return
      }
      setAvatarOverride(nextAvatar)
      const current = useAuthStore.getState().auth.user
      if (current) {
        let nextSetting: Record<string, unknown> = {}
        const currentSetting = current.setting
        if (typeof currentSetting === 'string') {
          try {
            const parsed: unknown = JSON.parse(currentSetting)
            if (
              parsed &&
              typeof parsed === 'object' &&
              !Array.isArray(parsed)
            ) {
              nextSetting = { ...(parsed as Record<string, unknown>) }
            }
          } catch {
            nextSetting = {}
          }
        } else if (
          currentSetting &&
          typeof currentSetting === 'object' &&
          !Array.isArray(currentSetting)
        ) {
          nextSetting = { ...currentSetting }
        }
        if (nextAvatar) nextSetting.avatar = nextAvatar
        else delete nextSetting.avatar
        useAuthStore.getState().auth.setUser({
          ...current,
          setting: nextSetting,
        })
      }
      toast.success(t('Profile updated successfully'))
      await props.onUpdate?.()
    } catch (error) {
      handleServerError(error, t('Failed to update profile'))
    } finally {
      setUploading(false)
    }
  }

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return
    try {
      await saveAvatar(await prepareAvatarDataUrl(file))
    } catch (error) {
      const tooLarge =
        error instanceof AvatarImageError && error.reason === 'size'
      const message = tooLarge
        ? 'Avatar image is too large'
        : 'Choose a PNG, JPEG, or WebP image'
      toast.error(t(message))
    }
  }

  return (
    <header
      data-slot='profile-identity'
      className={`${USER_PORTAL_CARD_CLASS} flex flex-col gap-4 sm:flex-row sm:items-center`}
    >
      <div className='flex min-w-0 flex-1 items-center gap-4'>
        <div className='rounded-2xl border border-[var(--portal-border)] p-1'>
          <Avatar className='size-12 rounded-xl text-sm sm:size-14'>
            {avatar && (
              <AvatarImage
                src={avatar}
                alt={t('Avatar')}
                className='rounded-xl'
              />
            )}
            <AvatarFallback
              className='rounded-xl font-semibold text-white'
              style={avatarFallbackStyle}
            >
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className='min-w-0'>
          {/* Identity only: name, handle, mail. Role, group and id were noise
              for an ordinary user, and a support lookup can read them from the
              account API instead. */}
          <p className='truncate text-xl font-semibold tracking-tight'>
            {displayName}
          </p>
          <p className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-[var(--portal-muted)]'>
            <span className='truncate'>@{profile.username}</span>
            {profile.email ? (
              <>
                <span aria-hidden='true'>·</span>
                <span className='truncate'>{profile.email}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div
        data-slot='profile-identity-actions'
        className='flex shrink-0 flex-wrap items-center gap-2 sm:ms-auto'
      >
        <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-label={t('Upload avatar')}
          title={t('Upload avatar')}
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageUp className='size-4' aria-hidden='true' />
        </Button>
        {avatar ? (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label={t('Remove avatar')}
            title={t('Remove avatar')}
            disabled={uploading}
            onClick={() => void saveAvatar('')}
          >
            <Trash2 className='size-4' aria-hidden='true' />
          </Button>
        ) : null}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/png,image/jpeg,image/webp'
          className='sr-only'
          aria-label={t('Avatar file')}
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            void handleAvatarFile(file)
          }}
        />
      </div>
    </header>
  )
}
