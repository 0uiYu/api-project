import { ExternalLink, Gift, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RedeemCodeCardProps {
  code: string
  onCodeChange: (code: string) => void
  onRedeem: () => void
  redeeming: boolean
  /** False when the administrator disabled redemption code usage. */
  enabled: boolean
  /** Optional link to buy redemption codes. */
  topupLink?: string
}

export function RedeemCodeCard(props: RedeemCodeCardProps) {
  const { t } = useTranslation()

  return (
    <div className='border-border bg-card/85 relative overflow-hidden rounded-2xl border p-5 shadow-[0_18px_38px_-34px_rgba(37,99,235,0.5),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md sm:p-6'>
      <span className='border-border bg-card/70 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] tracking-[0.14em] backdrop-blur-md'>
        <Gift className='size-3' aria-hidden='true' />
        {t('Redemption Code')}
      </span>

      {props.enabled ? (
        <form
          className='mt-4 space-y-2.5'
          onSubmit={(event) => {
            event.preventDefault()
            props.onRedeem()
          }}
        >
          <Label
            htmlFor='wallet-redemption-code'
            className='text-muted-foreground text-xs font-medium'
          >
            {t('Have a Code?')}
          </Label>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
            <Input
              id='wallet-redemption-code'
              value={props.code}
              onChange={(event) => props.onCodeChange(event.target.value)}
              placeholder={t('Enter your redemption code')}
              className='border-border bg-card/70 h-11 min-w-0 rounded-lg sm:flex-1'
              autoComplete='off'
            />
            <Button
              type='submit'
              disabled={props.redeeming}
              className='h-11 shrink-0 rounded-lg bg-[#1E3A8A] px-6 text-white shadow-[0_14px_30px_-16px_rgba(30,58,138,0.6),inset_0_1px_0_rgba(255,255,255,0.22)] hover:bg-[#17243D]!'
            >
              {props.redeeming && (
                <Loader2
                  data-icon='inline-start'
                  className='animate-spin'
                  aria-hidden='true'
                />
              )}
              {t('Redeem')}
            </Button>
          </div>

          {props.topupLink && (
            <p className='text-muted-foreground text-xs'>
              {t('Need a redemption code?')}{' '}
              <a
                href={props.topupLink}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 font-medium text-[#2563EB] underline-offset-4 hover:underline'
              >
                {t('Get one here')}
                <ExternalLink className='h-3 w-3' aria-hidden='true' />
              </a>
            </p>
          )}
        </form>
      ) : (
        <Alert className='mt-4'>
          <AlertDescription>
            {t(
              'Redemption codes are disabled until the administrator confirms compliance terms.'
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
