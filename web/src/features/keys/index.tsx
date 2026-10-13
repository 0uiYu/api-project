import { useTranslation } from 'react-i18next'

import {
  UserPortalHeading,
  UserPortalPage,
} from '@/components/layout'

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
      <UserPortalPage>
        <UserPortalHeading
          title={t('API Keys')}
          actions={<ApiKeysPrimaryButtons />}
        />

        <ApiKeyAddresses />

        {/* No filter bar and no section heading: the page title already says
            what this list is. */}
        <section className='flex min-w-0 flex-col'>
          <div className='flex h-[74svh] min-h-[480px] flex-col'>
            <ApiKeysTable />
          </div>
        </section>
      </UserPortalPage>

      <ApiKeysDialogs />
    </ApiKeysProvider>
  )
}
