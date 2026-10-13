import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useStatus } from '@/hooks/use-status'
import { useSystemConfig } from '@/hooks/use-system-config'
import { DEFAULT_SYSTEM_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'

type SystemBrandProps = {
  defaultName?: string
  defaultVersion?: string
  /**
   * Visual layout:
   * - 'sidebar': stacked card style (used inside the sidebar header).
   * - 'inline': compact horizontal pill (used inside the top app bar).
   */
  variant?: 'sidebar' | 'inline'
  /**
   * Inline size. The user portal uses 'large' so the brand reads as the page
   * owner rather than a small utility label in the admin tool bar.
   */
  size?: 'default' | 'large'
}

/**
 * System brand component
 * Displays current system logo + name.
 * - inline: compact pill in the top app bar; clicking navigates to home (/)
 * - sidebar: stacked card in the sidebar header (display only)
 */
export function SystemBrand(props: SystemBrandProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const { logo } = useSystemConfig()

  const variant = props.variant ?? 'sidebar'
  const name =
    status?.system_name || props.defaultName || DEFAULT_SYSTEM_NAME
  const version =
    status?.version || props.defaultVersion || t('Unknown version')

  if (variant === 'inline') {
    const large = props.size === 'large'
    return (
      <Link
        to='/'
        aria-label={t('Go to home')}
        className={cn(
          'text-foreground inline-flex min-w-0 items-center rounded-md transition-colors outline-none select-none',
          large
            ? 'h-9 gap-2 px-2 text-base font-semibold'
            : 'h-7 gap-1.5 px-1.5 text-sm font-medium',
          'hover:bg-accent focus-visible:ring-ring/40 focus-visible:ring-2'
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-center overflow-hidden',
            large ? 'size-7 rounded-lg' : 'size-5 rounded-md'
          )}
        >
          <img
            src={logo}
            alt={t('Logo')}
            className={cn('size-full object-cover', large ? 'rounded-lg' : 'rounded-md')}
          />
        </div>
        <span className={cn('truncate', large ? 'max-w-[16rem]' : 'max-w-[12rem]')}>
          {name}
        </span>
      </Link>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='hover:text-sidebar-foreground active:text-sidebar-foreground cursor-default hover:bg-transparent active:bg-transparent'
          render={<div />}
        >
          <div className='flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg'>
            <img
              src={logo}
              alt={t('Logo')}
              className='size-full rounded-lg object-cover'
            />
          </div>
          <div className='grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden'>
            <span className='truncate font-semibold'>{name}</span>
            <span className='truncate text-xs'>{version}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
