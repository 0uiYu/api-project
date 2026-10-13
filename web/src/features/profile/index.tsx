import { useTranslation } from 'react-i18next'

import { UserPortalHeading, UserPortalPage } from '@/components/layout'

import { AccountSections } from './components/account-sections'
import { ProfileHeader } from './components/profile-header'
import { useProfile } from './hooks'

/** Account page: identity header, then the account areas that matter. */
export function Profile() {
  const { t } = useTranslation()
  const { profile, loading, refreshProfile } = useProfile()

  return (
    <UserPortalPage>
      <UserPortalHeading title={t('My Account')} />
      <ProfileHeader
        profile={profile}
        loading={loading}
        onUpdate={refreshProfile}
      />
      <AccountSections profile={profile} />
    </UserPortalPage>
  )
}
