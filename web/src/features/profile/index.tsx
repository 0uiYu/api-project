import { useTranslation } from 'react-i18next'

import { MonoLabel } from '@/components/console/panel'
import { Main } from '@/components/layout'
import { useStatus } from '@/hooks/use-status'
import { useAuthStore } from '@/stores/auth-store'

import { CheckinCalendarCard } from './components/checkin-calendar-card'
import { SidebarModulesCard } from './components/sidebar-modules-card'
import { useProfile } from './hooks'

export function Profile() {
  const { t } = useTranslation()
  useProfile()
  const { status } = useStatus()
  const permissions = useAuthStore((s) => s.auth.user?.permissions)

  const checkinEnabled = status?.checkin_enabled === true
  const turnstileEnabled = !!(
    status?.turnstile_check && status?.turnstile_site_key
  )
  const turnstileSiteKey = status?.turnstile_site_key || ''
  const canConfigureSidebar = permissions?.sidebar_settings !== false

  return (
    <Main>
      <div className='min-h-0 flex-1 overflow-auto'>
        <div className='mx-auto w-full max-w-7xl px-3 py-5 sm:px-4 sm:py-6'>
          <header className='mb-3 flex items-center gap-2.5'>
            <span
              aria-hidden='true'
              className='h-3.5 w-[3px] shrink-0 rounded-full bg-[#1E3A8A] dark:bg-[#60A5FA]'
            />
            <MonoLabel>{t('Profile')}</MonoLabel>
          </header>

          {/* Two columns instead of a single card stack: the check-in ledger
              and the interface setup are separate concerns. */}
          <div className='grid gap-3 lg:grid-cols-2 lg:items-start'>
            {checkinEnabled && (
              <CheckinCalendarCard
                checkinEnabled={checkinEnabled}
                turnstileEnabled={turnstileEnabled}
                turnstileSiteKey={turnstileSiteKey}
              />
            )}
            {canConfigureSidebar && <SidebarModulesCard />}
          </div>
        </div>
      </div>
    </Main>
  )
}
