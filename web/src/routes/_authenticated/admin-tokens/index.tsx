import { createFileRoute } from '@tanstack/react-router'

import { AdminTokens } from '@/features/admin-tokens'

export const Route = createFileRoute('/_authenticated/admin-tokens/')({
  component: AdminTokens,
})
