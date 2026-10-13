import { useTranslation } from 'react-i18next'

import { UserPortalHeading, UserPortalPage } from '@/components/layout'

import { ConsumptionTrend } from './consumption-trend'
import { StatCards } from './stat-cards'

/**
 * User home: the account numbers, then the consumption trend. No welcome banner
 * and no shortcut buttons — the navigation already carries those actions.
 */
export function OverviewDashboard() {
  const { t } = useTranslation()

  return (
    <UserPortalPage>
      <UserPortalHeading title={t('Home')} />
      <StatCards />
      <ConsumptionTrend />
    </UserPortalPage>
  )
}
