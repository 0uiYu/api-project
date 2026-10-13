import { Link, useRouterState } from '@tanstack/react-router'
import {
  BookOpen,
  KeyRound,
  LayoutDashboard,
  Search,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationPopover } from '@/components/notification-popover'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { useNotifications } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'

import { SystemBrand } from './system-brand'

/**
 * The user path in order: home, find a model, get a key, read usage, manage the
 * account. Admins keep the sidebar shell, so this is the only navigation an
 * ordinary user ever sees.
 */
const PORTAL_LINKS = [
  { href: '/dashboard', titleKey: 'Home', icon: LayoutDashboard },
  { href: '/model-square', titleKey: 'Model Square', icon: Search },
  { href: '/keys', titleKey: 'API Keys', icon: KeyRound },
  { href: '/wallet', titleKey: 'Recharge', icon: Wallet },
] as const

type PortalHref = (typeof PORTAL_LINKS)[number]['href']

function isActivePath(pathname: string, href: PortalHref) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function PortalNavLink(props: {
  href: PortalHref
  title: string
  icon: LucideIcon
  active: boolean
  compact?: boolean
}) {
  const Icon = props.icon

  return (
    <Link
      to={props.href}
      aria-current={props.active ? 'page' : undefined}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg transition-colors',
        props.compact ? 'px-3 py-1.5 text-xs' : 'px-3 py-2 text-sm',
        props.active
          ? 'bg-[var(--portal-brand-soft)] font-medium text-[var(--portal-text)]'
          : 'text-[var(--portal-nav)] hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-text)]'
      )}
    >
      <Icon
        className={props.compact ? 'size-3.5' : 'size-4'}
        aria-hidden='true'
      />
      {props.title}
    </Link>
  )
}

export function UserPortalHeader() {
  const { t } = useTranslation()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const notifications = useNotifications()

  return (
    <header className='sticky top-0 z-40 shrink-0 border-b border-[var(--portal-border)] bg-[var(--portal-surface)]'>
      {/* Full-bleed bar: brand at the left edge, tools at the right edge, the
          way the concept mock lays it out. Only the page content is centred. */}
      <div className='flex h-[68px] w-full items-center gap-3 px-[18px] sm:px-7 lg:px-10'>
        <SystemBrand variant='inline' size='large' />

        <nav
          className='ms-auto hidden items-center gap-1 lg:flex'
          aria-label={t('User navigation')}
        >
          {PORTAL_LINKS.map((link) => (
            <PortalNavLink
              key={link.href}
              href={link.href}
              title={t(link.titleKey)}
              icon={link.icon}
              active={isActivePath(pathname, link.href)}
            />
          ))}
        </nav>

        <div className='ms-auto flex items-center gap-1 lg:ms-3'>
          <Link
            to='/about'
            className='hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-[var(--portal-nav)] transition-colors hover:bg-[var(--portal-brand-soft)] hover:text-[var(--portal-text)] lg:inline-flex'
          >
            <BookOpen className='size-4' aria-hidden='true' />
            {t('Docs')}
          </Link>
          <NotificationPopover
            open={notifications.popoverOpen}
            onOpenChange={notifications.setPopoverOpen}
            unreadCount={notifications.unreadCount}
            notice={notifications.notice}
            announcements={notifications.announcements}
            loading={notifications.loading}
          />
          <LanguageSwitcher />
          <ProfileDropdown />
        </div>
      </div>

      <nav
        className='flex w-full gap-1 overflow-x-auto px-[18px] pb-2 sm:px-7 lg:hidden'
        aria-label={t('User navigation')}
      >
        {PORTAL_LINKS.map((link) => (
          <PortalNavLink
            key={link.href}
            href={link.href}
            title={t(link.titleKey)}
            icon={link.icon}
            active={isActivePath(pathname, link.href)}
            compact
          />
        ))}
      </nav>
    </header>
  )
}
