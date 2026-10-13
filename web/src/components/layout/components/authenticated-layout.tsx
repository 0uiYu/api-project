import { AnimatedOutlet } from '@/components/page-transition'
import { SkipToMain } from '@/components/skip-to-main'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'
import { UserPortalHeader } from './user-portal-header'
import { USER_PORTAL_ROOT_CLASS } from '../user-portal-tokens'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout(props: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const userRole = useAuthStore((state) => state.auth.user?.role)
  const isAdmin = Boolean(userRole && userRole >= ROLE.ADMIN)

  if (!isAdmin) {
    return (
      <LayoutProvider>
        <SearchProvider>
          {/* Ordinary users never get the admin console shell: flat canvas,
              top navigation, one page-level scroll region. */}
          <div
            className={cn('flex h-svh flex-col', USER_PORTAL_ROOT_CLASS)}
          >
            <SkipToMain />
            <UserPortalHeader />
            <div className='relative flex min-h-0 min-w-0 flex-1 flex-col'>
              {props.children ?? <AnimatedOutlet />}
            </div>
          </div>
        </SearchProvider>
      </LayoutProvider>
    )
  }

  return (
    <LayoutProvider>
      <SearchProvider>
        <SidebarProvider defaultOpen={defaultOpen} className='flex-col'>
          <SkipToMain />
          <AppHeader />
          <div className='flex min-h-0 w-full flex-1'>
            <AppSidebar />
            <SidebarInset
              className={cn(
                '@container/content',
                'h-[calc(100svh-var(--app-header-height,0px))]',
                'min-h-0 overflow-hidden',
                'peer-data-[variant=inset]:h-[calc(100svh-var(--app-header-height,0px)-(var(--spacing)*4))]'
              )}
            >
              {/* Console-wide page surface: white field with ice-blue radials
                  and glows, matching the landing page. */}
              <div aria-hidden='true' className='console-surface' />
              <div
                aria-hidden='true'
                className='console-surface-glow console-surface-glow-a'
              />
              <div
                aria-hidden='true'
                className='console-surface-glow console-surface-glow-b'
              />
              <div className='relative flex min-h-0 flex-1 flex-col'>
                {props.children ?? <AnimatedOutlet />}
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </SearchProvider>
    </LayoutProvider>
  )
}
