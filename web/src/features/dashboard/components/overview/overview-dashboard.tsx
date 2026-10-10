import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'

import { StatCards } from './stat-cards'
import { UsageTrends } from './usage-trends'

/**
 * Data dashboard: account, usage and performance numbers first, then the
 * trend charts they describe.
 */
export function OverviewDashboard() {
  const { t } = useTranslation()

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Dashboard')}</SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className='flex flex-col gap-4'>
          <StatCards />
          <UsageTrends />
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
