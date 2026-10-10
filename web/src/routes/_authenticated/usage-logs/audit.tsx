import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuditLogs } from '@/features/usage-logs/audit'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/usage-logs/audit')({
  // Audit records belong to the admin workspace: any non-admin reaching the
  // URL directly is sent to the 403 page, the same way /users and
  // /subscriptions guard their admin-only workspaces.
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()

    if (!auth.user || auth.user.role < ROLE.ADMIN) {
      throw redirect({ to: '/403' })
    }
  },
  component: AuditLogs,
})
