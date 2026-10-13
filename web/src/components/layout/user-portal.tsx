import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { Main } from './components/main'

/** Single scroll region for a user-portal page: the document scrolls, not a nested box. */
export function UserPortalPage(props: {
  children: ReactNode
  className?: string
}) {
  return (
    <Main>
      <div className='min-h-0 flex-1 overflow-y-auto'>
        <div
          className={cn(
            // The mock centres a 1120px content column with 28px of side
            // padding, so the padded box is 1176px wide. The top padding is
            // tighter than the mock: the first element is a page title, not the
            // mock's bare heading, and 56px read as a gap under the header.
            'mx-auto flex w-full max-w-[1176px] flex-col gap-4 px-[18px] pt-4 pb-8 sm:px-7 sm:pt-6 sm:pb-14',
            props.className
          )}
        >
          {props.children}
        </div>
      </div>
    </Main>
  )
}

/** Page title block: one H1, one short line of context, optional page action. */
export function UserPortalHeading(props: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className='flex flex-wrap items-start justify-between gap-x-4 gap-y-3'>
      <div className='min-w-0'>
        <h1 className='text-[28px] leading-tight font-bold tracking-tight'>
          {props.title}
        </h1>
        {props.description ? (
          <p className='mt-2 text-sm text-[var(--portal-muted)]'>
            {props.description}
          </p>
        ) : null}
      </div>
      {props.actions ? (
        <div className='flex shrink-0 flex-wrap items-center gap-2'>
          {props.actions}
        </div>
      ) : null}
    </header>
  )
}
