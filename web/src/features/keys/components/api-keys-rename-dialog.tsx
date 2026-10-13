import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { handleServerError } from '@/lib/handle-server-error'

import { updateApiKey } from '../api'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants'
import { useApiKeys } from './api-keys-provider'

/**
 * Renaming a key. The update payload repeats every other field of the row
 * unchanged, so this dialog can never reset quota, group or restrictions.
 */
export function ApiKeysRenameDialog() {
  const { t } = useTranslation()
  const { open, setOpen, currentRow, triggerRefresh } = useApiKeys()
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open === 'rename' && currentRow) setName(currentRow.name)
  }, [open, currentRow])

  const handleSubmit = async () => {
    const nextName = name.trim()
    if (!currentRow || !nextName) return

    setIsSaving(true)
    try {
      const result = await updateApiKey({
        id: currentRow.id,
        name: nextName,
        remain_quota: currentRow.remain_quota,
        expired_time: currentRow.expired_time,
        unlimited_quota: currentRow.unlimited_quota,
        model_limits_enabled: currentRow.model_limits_enabled,
        model_limits: currentRow.model_limits ?? '',
        allow_ips: currentRow.allow_ips ?? '',
        group: currentRow.group ?? '',
        auto_groups: currentRow.auto_groups ?? [],
        cross_group_retry: currentRow.cross_group_retry,
      })
      if (result.success) {
        toast.success(t(SUCCESS_MESSAGES.API_KEY_UPDATED))
        setOpen(null)
        triggerRefresh()
      } else {
        handleServerError(result, t(ERROR_MESSAGES.UPDATE_FAILED))
      }
    } catch (error) {
      handleServerError(error, t(ERROR_MESSAGES.UNEXPECTED))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={open === 'rename'}
      onOpenChange={(isOpen) => !isOpen && setOpen(null)}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('Edit')}</DialogTitle>
          <DialogDescription>{t('Set API key basic information')}</DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-2'>
          <Label htmlFor='api-key-rename'>{t('Name')}</Label>
          <Input
            id='api-key-rename'
            value={name}
            autoFocus
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleSubmit()
            }}
          />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant='outline' />}>
            {t('Cancel')}
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSaving || !name.trim()}>
            {isSaving ? t('Saving...') : t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
