import { createFileRoute, redirect } from '@tanstack/react-router'
import z from 'zod'

import { Dashboard } from '@/features/dashboard'
import {
  DASHBOARD_SECTION_IDS,
  DASHBOARD_DEFAULT_SECTION,
} from '@/features/dashboard/section-registry'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

// The operations overview deep-links into the model analytics section with the
// range the operator was looking at. Invalid values are dropped rather than
// rejected so a stale link still opens the page.
const dashboardSearchSchema = z.object({
  hours: z.number().min(1).max(720).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/dashboard/$section')({
  validateSearch: dashboardSearchSchema,
  beforeLoad: ({ params }) => {
    const validSections = DASHBOARD_SECTION_IDS as unknown as string[]
    if (!validSections.includes(params.section)) {
      throw redirect({
        to: '/dashboard/$section',
        params: { section: DASHBOARD_DEFAULT_SECTION },
      })
    }
    // The user portal only exposes the overview. Model analytics is an admin
    // view, so an ordinary user typing the URL lands back on the overview
    // instead of an admin chart page.
    const role = useAuthStore.getState().auth.user?.role
    const isAdmin = Boolean(role && role >= ROLE.ADMIN)
    if (!isAdmin && params.section !== DASHBOARD_DEFAULT_SECTION) {
      throw redirect({
        to: '/dashboard/$section',
        params: { section: DASHBOARD_DEFAULT_SECTION },
      })
    }
  },
  component: Dashboard,
})
