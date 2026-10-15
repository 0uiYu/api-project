import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ModelsDialogs } from './components/models-dialogs'
import { ModelsPrimaryButtons } from './components/models-primary-buttons'
import { ModelsProvider, useModels } from './components/models-provider'
import { ModelsTable } from './components/models-table'
import { VendorsTable } from './components/vendors-table'
import {
  type ModelsSectionId,
  MODELS_DEFAULT_SECTION,
  MODELS_SECTION_IDS,
} from './section-registry'

const route = getRouteApi('/_authenticated/models/$section')

const SECTION_META: Record<
  ModelsSectionId,
  { titleKey: string; tabKey: string }
> = {
  metadata: {
    titleKey: 'Model management',
    tabKey: 'Models',
  },
  vendors: { titleKey: 'Vendor management', tabKey: 'Vendors' },
}

function ModelsContent() {
  const { t } = useTranslation()
  const navigate = useNavigate({ from: '/models/$section' })
  const { tabCategory, setTabCategory, setOpen, setCurrentVendor } = useModels()
  const params = route.useParams()
  const activeSection = (params.section ??
    MODELS_DEFAULT_SECTION) as ModelsSectionId

  // keep context state in sync (for components that rely on it)
  useEffect(() => {
    if (tabCategory !== activeSection) {
      setTabCategory(activeSection)
    }
  }, [activeSection, setTabCategory, tabCategory])

  const handleSectionChange = useCallback(
    (section: string) => {
      void navigate({
        to: '/models/$section',
        params: { section: section as ModelsSectionId },
        search: (previous) => previous,
      })
    },
    [navigate]
  )

  const meta = SECTION_META[activeSection] ?? SECTION_META.metadata

  let actions = <ModelsPrimaryButtons />
  let content = <ModelsTable />
  if (activeSection === 'vendors') {
    actions = (
      <Button
        size='sm'
        onClick={() => {
          setCurrentVendor(null)
          setOpen('create-vendor')
        }}
      >
        <Plus className='size-4' />
        {t('Add Vendor')}
      </Button>
    )
    content = <VendorsTable />
  }

  return (
    <>
      <SectionPageLayout
        fixedContent
        stackActionsOnMobile={activeSection === 'metadata'}
      >
        <SectionPageLayout.Title>{t(meta.titleKey)}</SectionPageLayout.Title>
        <SectionPageLayout.Actions>{actions}</SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <div className='flex h-full min-h-0 flex-col gap-4'>
            <Tabs value={activeSection} onValueChange={handleSectionChange}>
              <TabsList className='max-w-full flex-wrap justify-start group-data-horizontal/tabs:h-auto'>
                {MODELS_SECTION_IDS.map((section) => (
                  <TabsTrigger key={section} value={section}>
                    {t(SECTION_META[section].tabKey)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className='min-h-0 flex-1'>{content}</div>
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <ModelsDialogs />
    </>
  )
}

export function Models() {
  return (
    <ModelsProvider>
      <ModelsContent />
    </ModelsProvider>
  )
}
