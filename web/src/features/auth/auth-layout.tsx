import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { useSystemConfig } from '@/hooks/use-system-config'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()

  return (
    <div className='bg-muted/30 grid min-h-svh max-w-none lg:grid-cols-2'>
      <div className='bg-primary/5 relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-center lg:px-16 xl:px-24'>
        <div className='bg-primary/10 absolute -top-32 -right-32 size-96 rounded-full blur-3xl' />
        <div className='bg-primary/5 absolute -bottom-32 -left-32 size-96 rounded-full blur-3xl' />
        <div className='relative max-w-md'>
          {/* Same runtime brand the rest of the site uses, not a literal. */}
          <div className='bg-primary text-primary-foreground mb-8 flex size-12 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold shadow-sm'>
            {loading ? (
              <Skeleton className='size-full rounded-2xl' />
            ) : (
              <img
                src={logo}
                alt={t('Logo')}
                className='size-full object-cover'
              />
            )}
          </div>
          <p className='text-primary mb-4 text-xs font-semibold tracking-[0.16em] uppercase'>
            {t('Developer portal')}
          </p>
          <h2 className='text-foreground text-4xl leading-tight font-semibold tracking-tight xl:text-5xl'>
            {t('Connect to quality models worldwide through a Stable API platform')}
          </h2>
          <p className='text-muted-foreground mt-6 max-w-sm text-base leading-7'>
            {t('One API for the models on this site, so developers can connect and focus on the product.')}
          </p>
          <div className='mt-8 flex items-center gap-2'>
            <span className='bg-primary/20 h-2 w-10 rounded-full' />
            <span className='bg-primary/50 h-2 w-20 rounded-full' />
            <span className='bg-primary h-2 w-8 rounded-full' />
          </div>
        </div>
      </div>
      <Link
        to='/'
        className='absolute top-4 left-4 z-10 flex items-center gap-2 transition-opacity hover:opacity-80 sm:top-8 sm:left-8'
      >
        <div className='relative h-8 w-8'>
          {loading ? (
            <Skeleton className='absolute inset-0 rounded-full' />
          ) : (
            <img
              src={logo}
              alt={t('Logo')}
              className='h-8 w-8 rounded-full object-cover'
            />
          )}
        </div>
        {loading ? (
          <Skeleton className='h-6 w-24' />
        ) : (
          <h1 className='text-xl font-medium'>{systemName}</h1>
        )}
      </Link>
      <div className='container flex items-center pt-16 sm:pt-0'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-2 px-4 py-8 sm:w-[480px] sm:p-8'>
          {children}
        </div>
      </div>
    </div>
  )
}
