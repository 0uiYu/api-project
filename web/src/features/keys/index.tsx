import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'

import { ApiKeysDialogs } from './components/api-keys-dialogs'
import {
  ApiKeyAddresses,
  ApiKeysPrimaryButtons,
} from './components/api-keys-primary-buttons'
import {
  ApiKeysCreateRequest,
  ApiKeysProvider,
} from './components/api-keys-provider'
import { ApiKeysTable } from './components/api-keys-table'

function ignoreCreateRequest() {}

export function ApiKeys(props: {
  openCreate?: boolean
  onCreateRequestHandled?: () => void
}) {
  const { t } = useTranslation()
  return (
    <ApiKeysProvider>
      <ApiKeysCreateRequest
        requested={props.openCreate === true}
        onHandled={props.onCreateRequestHandled ?? ignoreCreateRequest}
      />
      <SectionPageLayout fixedContent>
        <SectionPageLayout.Title>{t('API Keys')}</SectionPageLayout.Title>
        <SectionPageLayout.Actions>
          <ApiKeysPrimaryButtons />
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <div className='flex h-full min-h-0 flex-col gap-3'>
            <ApiKeyAddresses />
            <div className='min-h-0 flex-1'>
              <ApiKeysTable />
            </div>
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <ApiKeysDialogs />
    </ApiKeysProvider>
  )
}
