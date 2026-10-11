import { createFileRoute } from '@tanstack/react-router'

import { AffiliatePage } from '@/features/wallet/affiliate-page'

export const Route = createFileRoute('/_authenticated/wallet/affiliate')({
  component: AffiliatePage,
})
