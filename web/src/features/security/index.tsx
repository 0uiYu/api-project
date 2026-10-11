import { Link2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout/components/section-page-layout'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'
import { ProfileHeader } from '@/features/profile/components/profile-header'
import { useProfile } from '@/features/profile/hooks/use-profile'
import { ROLE } from '@/lib/roles'

import { AccessTokensCard } from './components/access-tokens-card'
import { AccountActionCard } from './components/account-action-card'
import { AccountBindings } from './components/account-bindings'
import { LoginSessionsCard } from './components/login-sessions-card'
import { PasskeyCard } from './components/passkey-card'
import { PrivacyCard } from './components/privacy-card'
import { TwoFACard } from './components/two-fa-card'

const profileSheetClassName =
  'overflow-hidden rounded-2xl border border-t-2 border-[#E2E8F0] border-t-[#2563EB] bg-white text-[#17243D] shadow-[0_24px_50px_-36px_rgba(30,58,138,0.45)] [--accent:#F4F8FC] [--accent-foreground:#17243D] [--background:#ffffff] [--border:#E2E8F0] [--card:#ffffff] [--card-foreground:#17243D] [--foreground:#17243D] [--input:#E2E8F0] [--muted:#F8FAFD] [--muted-foreground:#64748B] [--primary:#2563EB] [--primary-foreground:#ffffff] [--ring:#2563EB]'

function ProfileSheetSection(props: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={props.id}
      className='grid gap-3 px-4 py-5 sm:px-6 md:grid-cols-[11rem_minmax(0,1fr)] md:items-start md:gap-8'
    >
      <h3
        id={props.id}
        className='text-sm font-semibold text-[#1E3A8A] md:pt-2'
      >
        {props.title}
      </h3>
      <div className='flex min-w-0 flex-col gap-3'>{props.children}</div>
    </section>
  )
}

export function Security() {
  const { t } = useTranslation()
  const { profile, loading, refreshProfile, fetchProfile } = useProfile()

  let body: ReactNode
  if (loading) {
    body = (
      <div
        role='status'
        aria-label={t('Loading...')}
        className='flex flex-col gap-4 px-4 py-5 sm:px-6'
      >
        <Skeleton className='h-16 w-full' />
        <Skeleton className='h-16 w-full' />
        <Skeleton className='h-16 w-full' />
      </div>
    )
  } else if (!profile) {
    body = (
      <div className='px-4 py-8 sm:px-6'>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('Failed to load profile')}</EmptyTitle>
            <EmptyDescription>
              {t('Refresh the list and try again.')}
            </EmptyDescription>
          </EmptyHeader>
          <Button
            type='button'
            variant='outline'
            onClick={() => void fetchProfile()}
          >
            {t('Retry')}
          </Button>
        </Empty>
      </div>
    )
  } else {
    const showAccountAdministration = (profile.role ?? 0) >= ROLE.ADMIN
    body = (
      <div className='flex flex-col divide-y divide-[#E7EEF6]'>
        <ProfileSheetSection
          id='security-authentication'
          title={t('Login & Authentication')}
        >
          <AccountActionCard
            action='password'
            username={profile.username}
            hasPassword={profile.has_password}
            onUpdate={refreshProfile}
          />
          {showAccountAdministration ? (
            <TitledCard
              title={t('Account Bindings')}
              icon={<Link2 className='size-4' />}
              headerClassName='px-3 py-2.5 !pb-2.5 sm:px-4 sm:py-2.5 sm:!pb-2.5'
              contentClassName='p-3 sm:p-3'
              titleClassName='text-sm sm:text-sm'
              iconClassName='size-7 sm:size-7'
              disableHoverEffect
            >
              <AccountBindings profile={profile} onUpdate={refreshProfile} />
            </TitledCard>
          ) : null}
        </ProfileSheetSection>
        <ProfileSheetSection
          id='security-access'
          title={t('Sessions & Access')}
        >
          <LoginSessionsCard />
          {showAccountAdministration ? <AccessTokensCard /> : null}
        </ProfileSheetSection>
        <ProfileSheetSection id='security-account' title={t('Account Actions')}>
          <AccountActionCard action='delete' username={profile.username} />
        </ProfileSheetSection>
        {showAccountAdministration ? (
          <ProfileSheetSection
            id='security-verification'
            title={t('Security verification')}
          >
            <PasskeyCard loading={loading} />
            <TwoFACard loading={loading} />
          </ProfileSheetSection>
        ) : null}
        {showAccountAdministration ? (
          <ProfileSheetSection id='security-privacy' title={t('Privacy')}>
            <PrivacyCard profile={profile} onUpdate={refreshProfile} />
          </ProfileSheetSection>
        ) : null}
      </div>
    )
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Profile')}</SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className='mx-auto w-full max-w-7xl'>
          <div
            data-slot='profile-sheet'
            aria-busy={loading || undefined}
            className={profileSheetClassName}
          >
            <ProfileHeader
              profile={profile}
              loading={loading}
              onUpdate={refreshProfile}
            />
            {body}
          </div>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
