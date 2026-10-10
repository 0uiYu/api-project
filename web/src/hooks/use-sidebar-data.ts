import {
  Activity,
  BarChart3,
  Box,
  CreditCard,
  FileText,
  Key,
  PlugZap,
  Radio,
  ServerCog,
  Settings,
  ShieldCheck,
  ScrollText,
  Store,
  Ticket,
  User,
  Users,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { SidebarData } from '@/components/layout/types'
import { ROLE } from '@/lib/roles'

/**
 * Root navigation groups for the application sidebar.
 *
 * These are shown when the URL does not match any nested sidebar view
 * registered in `layout/lib/sidebar-view-registry.ts`.
 *
 * The personal entries (wallet/profile/security) live in the Console group and
 * the model square is listed there too, so the console has a single "Console"
 * group plus "Admin".
 *
 * The chat area, the playground and the task/drawing log entries stay out of
 * the root menu; their routes remain reachable by URL. The call analytics and
 * audit workspaces are admin-only reporting tools, so they live in the Admin
 * group next to the rest of the admin workspace.
 */
export function useSidebarData(): SidebarData {
  const { t } = useTranslation()

  return {
    navGroups: [
      {
        id: 'general',
        title: t('User Console'),
        items: [
          {
            title: t('Dashboard'),
            url: '/dashboard/overview',
            icon: Activity,
          },
          {
            title: t('Model Square'),
            url: '/model-square',
            icon: Store,
          },
          {
            title: t('API Keys'),
            url: '/keys',
            icon: Key,
          },
          {
            title: t('Usage Records'),
            url: '/usage-logs/common',
            icon: FileText,
          },
          {
            title: t('Wallet'),
            url: '/wallet',
            icon: Wallet,
          },
          {
            title: t('Profile'),
            url: '/profile',
            icon: User,
          },
          {
            title: t('Security & Access'),
            url: '/security',
            icon: ShieldCheck,
          },
        ],
      },
      {
        id: 'admin',
        title: t('Admin Console'),
        items: [
          {
            title: t('Model Call Analytics'),
            url: '/dashboard/models',
            icon: BarChart3,
          },
          {
            title: t('Audit Logs'),
            url: '/usage-logs/audit',
            icon: ScrollText,
          },
          {
            title: t('Channels'),
            url: '/channels',
            icon: Radio,
          },
          {
            title: t('Models'),
            url: '/models/metadata',
            icon: Box,
          },
          {
            title: t('Users'),
            url: '/users',
            icon: Users,
          },
          {
            title: t('Redemption Codes'),
            url: '/redemption-codes',
            icon: Ticket,
          },
          {
            title: t('Subscriptions'),
            url: '/subscriptions',
            icon: CreditCard,
          },
          {
            title: t('System Info'),
            url: '/system-info',
            icon: ServerCog,
            requiredRole: ROLE.SUPER_ADMIN,
          },
          {
            title: t('Task Plugins'),
            url: '/task-plugins',
            icon: PlugZap,
            requiredRole: ROLE.SUPER_ADMIN,
          },
          {
            title: t('System Settings'),
            url: '/system-settings/site',
            activeUrls: ['/system-settings'],
            icon: Settings,
            requiredRole: ROLE.SUPER_ADMIN,
          },
        ],
      },
    ],
  }
}
