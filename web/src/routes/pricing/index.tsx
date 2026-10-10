import { createFileRoute, redirect } from '@tanstack/react-router'

import { Pricing } from '@/features/pricing'
import { pricingSearchSchema } from '@/features/pricing/search'
import { getModuleAccessForGuard } from '@/lib/nav-modules'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/pricing/')({
  validateSearch: pricingSearchSchema,
  beforeLoad: async ({ context, location }) => {
    const access = await getModuleAccessForGuard(context.queryClient, 'pricing')
    if (!access.enabled) {
      throw redirect({ to: '/' })
    }
    if (access.requireAuth) {
      const { auth } = useAuthStore.getState()
      if (!auth.user) {
        throw redirect({
          to: '/sign-in',
          search: { redirect: location.href },
        })
      }
    }
  },
  component: PublicPricing,
})

function PublicPricing() {
  const search = Route.useSearch()

  return <Pricing search={search} />
}
