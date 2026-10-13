import { Link } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { USER_PORTAL_CARD_CLASS } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTwoFA } from '@/features/security/hooks/use-two-fa'
import { useAuthStore } from '@/stores/auth-store'

import type { UserProfile } from '../types'

type AccountSection = 'profile' | 'security'

function DefinitionRow(props: { label: string; children: ReactNode }) {
  return (
    <div className='flex min-w-0 flex-col gap-1'>
      <dt className='text-xs text-[var(--portal-muted)]'>{props.label}</dt>
      <dd className='min-w-0 text-sm break-words'>{props.children}</dd>
    </div>
  )
}

/**
 * The two account areas an ordinary user needs: who they are, and how they sign
 * in. The old "access settings" tab only repeated navigation that the header
 * already offers.
 */
export function AccountSections(props: { profile: UserProfile | null }) {
  const { t } = useTranslation()
  const [section, setSection] = useState<AccountSection>('profile')
  const { status: twoFA, loading: twoFALoading } = useTwoFA()
  const session = useAuthStore((state) => state.auth.session)
  const profile = props.profile
  let twoFALabel = t('Not enabled')
  if (twoFALoading) {
    twoFALabel = t('Loading...')
  } else if (twoFA.enabled) {
    twoFALabel = t('Enabled')
  }

  return (
    <section className={USER_PORTAL_CARD_CLASS}>
      <Tabs
        value={section}
        onValueChange={(value) => setSection(value as AccountSection)}
      >
        <TabsList>
          <TabsTrigger value='profile'>{t('Basic profile')}</TabsTrigger>
          <TabsTrigger value='security'>{t('Security settings')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className='mt-5'>
        {section === 'profile' ? (
          <div className='flex flex-col gap-4'>
            <dl className='grid gap-4 sm:grid-cols-2'>
              <DefinitionRow label={t('Username')}>
                {profile ? `@${profile.username}` : '—'}
              </DefinitionRow>
              <DefinitionRow label={t('Display name')}>
                {profile?.display_name || '—'}
              </DefinitionRow>
              <DefinitionRow label={t('Email')}>
                {profile?.email || t('Not bound')}
              </DefinitionRow>
              <DefinitionRow label={t('User ID')}>
                {profile ? String(profile.id) : '—'}
              </DefinitionRow>
            </dl>
            <p className='text-xs text-[var(--portal-muted)]'>
              {t('Use the account header above to change the avatar.')}
            </p>
          </div>
        ) : null}

        {section === 'security' ? (
          <div className='flex flex-col gap-4'>
            <dl className='grid gap-4 sm:grid-cols-2'>
              <DefinitionRow label={t('Password')}>
                {profile?.has_password ? t('Set') : t('Not set')}
              </DefinitionRow>
              <DefinitionRow label={t('Sign-in method')}>
                {session?.login_method || '—'}
              </DefinitionRow>
              <DefinitionRow label={t('Two-factor authentication')}>
                {twoFALabel}
              </DefinitionRow>
              <DefinitionRow label={t('Passkey')}>
                <Link
                  to='/security'
                  className='text-[var(--portal-brand)] hover:underline'
                >
                  {t('Manage')}
                </Link>
              </DefinitionRow>
            </dl>
            <div>
              <Button
                size='sm'
                variant='outline'
                render={<Link to='/security' />}
              >
                {t('Open security settings')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
