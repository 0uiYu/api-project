import { createFileRoute, redirect } from '@tanstack/react-router'

import { DASHBOARD_DEFAULT_SECTION } from '@/features/dashboard/section-registry'
import { Pricing } from '@/features/pricing'
import { pricingSearchSchema } from '@/features/pricing/search'
import { getModuleAccessForGuard } from '@/lib/nav-modules'

export const Route = createFileRoute('/_authenticated/model-square/')({
  validateSearch: pricingSearchSchema,
  beforeLoad: async ({ context }) => {
    const access = await getModuleAccessForGuard(context.queryClient, 'pricing')
    if (!access.enabled) {
      throw redirect({
        to: '/dashboard/$section',
        params: { section: DASHBOARD_DEFAULT_SECTION },
      })
    }
  },
  component: ConsoleModelSquare,
})

function ConsoleModelSquare() {
  const search = Route.useSearch()

  return <Pricing variant='console' search={search} />
}
