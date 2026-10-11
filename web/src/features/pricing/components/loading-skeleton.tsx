import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { VIEW_MODES, type ViewMode } from '../constants'

export interface LoadingSkeletonProps {
  viewMode?: ViewMode
}

export function LoadingSkeleton(props: LoadingSkeletonProps) {
  return (
    <div aria-busy='true'>
      <div className='mx-auto mb-5 flex max-w-3xl flex-col items-center pt-5 sm:mb-10 sm:pt-10'>
        <Skeleton className='h-[clamp(2.3rem,6.325vw,4.025rem)] w-48 max-w-full sm:w-64' />
        <Skeleton className='mt-3 h-5 w-56 max-w-full sm:mt-4 sm:h-6' />
        <Skeleton className='mt-2 h-5 w-full max-w-xl' />
        <Skeleton className='mt-4 h-10 w-full max-w-2xl sm:mt-6' />
      </div>
      <div className='grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]'>
        <div className='hidden self-start rounded-xl border p-3 xl:block'>
          <Skeleton className='mb-4 h-5 w-24' />
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className='flex flex-col gap-3 border-b py-4 last:border-0'
            >
              <Skeleton className='h-4 w-28' />
              <div className='flex flex-wrap gap-2'>
                <Skeleton className='h-7 w-24' />
                <Skeleton className='h-7 w-20' />
                <Skeleton className='h-7 w-28' />
              </div>
            </div>
          ))}
        </div>
        <div className='flex min-w-0 flex-col gap-4'>
          <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3'>
            <Skeleton className='h-7 w-20' />
            <div className='flex flex-wrap gap-2'>
              <Skeleton className='h-7 w-32' />
              <Skeleton className='h-7 w-20' />
              <Skeleton className='h-7 w-24' />
            </div>
          </div>
          {props.viewMode === VIEW_MODES.TABLE ? (
            <div className='overflow-hidden rounded-xl border'>
              {Array.from({ length: 10 }, (_, index) => (
                <div
                  key={index}
                  className='flex gap-4 border-b p-4 last:border-0'
                >
                  <Skeleton className='h-5 w-40 max-w-full' />
                  <Skeleton className='h-5 flex-1' />
                  <Skeleton className='h-5 w-20' />
                </div>
              ))}
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {Array.from({ length: 6 }, (_, index) => (
                <Card
                  key={index}
                  className='gap-0 overflow-hidden rounded-2xl border border-t-2 border-[#E2E8F0] border-t-[#2563EB] bg-white py-0 ring-0'
                >
                  <CardHeader className='flex flex-row gap-3 border-b border-[#E7EEF6] bg-[#F4F8FC] px-4 py-3.5'>
                    <Skeleton className='size-10 shrink-0 rounded-lg' />
                    <div className='flex min-w-0 flex-1 flex-col gap-2'>
                      <Skeleton className='h-5 w-40 max-w-full' />
                      <Skeleton className='h-3 w-20' />
                    </div>
                    <Skeleton className='size-7 shrink-0' />
                  </CardHeader>
                  <CardContent className='flex flex-1 flex-col gap-3 px-4 py-3.5'>
                    <Skeleton className='h-4 w-16' />
                    <div className='grid grid-cols-3 gap-4'>
                      <Skeleton className='h-10' />
                      <Skeleton className='h-10' />
                      <Skeleton className='h-10' />
                    </div>
                    <div className='grid grid-cols-2 gap-3 border-t border-[#E7EEF6] pt-3'>
                      <Skeleton className='h-4 w-28 max-w-full' />
                      <Skeleton className='h-4 w-28 max-w-full' />
                    </div>
                  </CardContent>
                  <CardFooter className='border-0 bg-[#F8FAFD] px-4 py-3'>
                    <div className='flex w-full items-center justify-between gap-3'>
                      <div className='flex items-start gap-5'>
                        <div className='flex w-24 shrink-0 flex-col gap-1'>
                          <Skeleton className='h-4 w-10' />
                          <div className='flex h-3 w-24 items-center gap-px'>
                            {Array.from({ length: 24 }, (_, bar) => (
                              <Skeleton
                                key={bar}
                                className='h-full w-[3px] rounded-xs'
                              />
                            ))}
                          </div>
                        </div>
                        <Skeleton className='h-8 w-6' />
                        <Skeleton className='h-8 w-8' />
                      </div>
                      <Skeleton className='h-7 w-12' />
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
