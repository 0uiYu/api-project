import type { Row } from '@tanstack/react-table'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { apiKeySchema } from '../types'
import { useApiKeys } from './api-keys-provider'

type DataTableRowActionsProps<TData> = {
  row: Row<TData>
}

/**
 * Two actions only: rename the key, or delete it. Deleting opens the shared
 * confirmation dialog, so a click can never destroy a key by itself.
 */
export function DataTableRowActions<TData>(
  props: DataTableRowActionsProps<TData>
) {
  const { t } = useTranslation()
  const apiKey = apiKeySchema.parse(props.row.original)
  const { setOpen, setCurrentRow } = useApiKeys()

  return (
    <div className='flex items-center gap-1'>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={t('Edit')}
              onClick={() => {
                setCurrentRow(apiKey)
                setOpen('rename')
              }}
            />
          }
        >
          <Pencil />
        </TooltipTrigger>
        <TooltipContent>{t('Edit')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={t('Delete')}
              onClick={() => {
                setCurrentRow(apiKey)
                setOpen('delete')
              }}
            />
          }
        >
          <Trash2 />
        </TooltipTrigger>
        <TooltipContent>{t('Delete')}</TooltipContent>
      </Tooltip>
    </div>
  )
}
