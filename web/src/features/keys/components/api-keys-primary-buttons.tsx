import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { LoadingState } from '@/components/loading-state'
import { Button } from '@/components/ui/button'
import { useApiInfo } from '@/features/dashboard/hooks/use-status-data'
import { useStatus } from '@/hooks/use-status'

import { useApiKeys } from './api-keys-provider'

function useApiAddresses() {
  const { t } = useTranslation()
  const { status, loading } = useStatus()
  const { items } = useApiInfo()
  const serverAddress =
    (typeof status?.server_address === 'string' &&
      status.server_address.trim()) ||
    ''
  const addresses = items.length
    ? items
    : [
        {
          url: serverAddress || window.location.origin,
          route: serverAddress ? t('Default API address') : t('Current domain'),
          description: '',
        },
      ]

  return { addresses, loading }
}

export function ApiKeyAddresses() {
  const { t } = useTranslation()
  const { addresses, loading } = useApiAddresses()

  if (loading) {
    return <LoadingState inline size='sm' message={t('Loading...')} />
  }

  return (
    <div
      role='list'
      aria-label={t('API Addresses')}
      className='flex flex-wrap gap-2'
    >
      {addresses.map((address) => (
        <div
          key={address.url}
          role='listitem'
          className='flex max-w-full min-w-0 items-center gap-2 rounded-full border border-[#D7E4F7] bg-white py-1 ps-3 pe-1 text-[#17243D]'
        >
          <span className='shrink-0 text-xs text-[#64748B]'>
            {address.route}
          </span>
          <code className='min-w-0 font-mono text-[13px] break-all text-[#475569]'>
            {address.url}
          </code>
          <CopyButton
            value={address.url}
            className='size-7 shrink-0 text-[#64748B] hover:bg-[#F8FAFD] hover:text-[#17243D]'
            tooltip={t('Copy API URL')}
            aria-label={`${t('Copy API URL')}: ${address.url}`}
          />
        </div>
      ))}
    </div>
  )
}

export function ApiKeysPrimaryButtons() {
  const { t } = useTranslation()
  const { setOpen } = useApiKeys()

  return (
    <Button size='sm' onClick={() => setOpen('create')}>
      <Plus className='h-4 w-4' />
      {t('Create API Key')}
    </Button>
  )
}
