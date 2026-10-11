import { createFileRoute } from '@tanstack/react-router'

import { SubscriptionPlansPage } from '@/features/wallet/subscription-plans-page'

export const Route = createFileRoute('/_authenticated/wallet/subscriptions')({
  component: SubscriptionPlansPage,
})
