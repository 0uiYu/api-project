import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { LoadingState } from '@/components/loading-state'
import { Button } from '@/components/ui/button'

import { useApiAddresses } from '../hooks'
import { useApiKeys } from './api-keys-provider'

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
          className='flex max-w-full min-w-0 items-center gap-2 rounded-full border border-[var(--portal-border)] bg-[var(--portal-surface)] py-1 ps-3 pe-1 text-[var(--portal-text)]'
        >
          <span className='shrink-0 text-xs text-[var(--portal-muted)]'>
            {address.route}
          </span>
          <code className='min-w-0 font-mono text-[13px] break-all text-[var(--portal-text)]'>
            {address.url}
          </code>
          <CopyButton
            value={address.url}
            className='size-7 shrink-0 text-[var(--portal-muted)]'
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
    // Slightly larger than the toolbar default, and it darkens on hover so the
    // primary action reads as pressable.
    <Button
      size='lg'
      className='hover:brightness-90'
      onClick={() => setOpen('create')}
    >
      <Plus className='h-4 w-4' />
      {t('Create API Key')}
    </Button>
  )
}
