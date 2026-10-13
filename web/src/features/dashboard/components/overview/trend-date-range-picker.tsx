import { CalendarDays } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DateRange } from 'react-day-picker'
import { enUS, zhCN } from 'react-day-picker/locale'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatDateStr } from '@/lib/format'
import { cn } from '@/lib/utils'

interface TrendDateRangePickerProps {
  start?: Date
  end?: Date
  onChange: (range: { start?: Date; end?: Date }) => void
  /** Chip styling so it lines up with the preset buttons next to it. */
  className?: string
  active?: boolean
}

/**
 * Day-precision custom range: clicking the trigger opens two month calendars;
 * picking an end date applies the range and closes the popover.
 */
export function TrendDateRangePicker(props: TrendDateRangePickerProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const calendarLocale = useMemo(
    () => ({ en: enUS, zhCN })[i18n.language as 'en' | 'zhCN'] ?? enUS,
    [i18n.language]
  )

  const selected: DateRange | undefined = props.start
    ? { from: props.start, to: props.end }
    : undefined
  const label =
    props.start && props.end
      ? `${formatDateStr(props.start)} – ${formatDateStr(props.end)}`
      : t('Custom')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type='button'
            variant='ghost'
            size='sm'
            aria-pressed={props.active}
            className={cn(
              'gap-1.5 rounded-full border px-3 py-1.5 text-xs font-normal',
              props.active
                ? 'border-[var(--portal-brand)] bg-[var(--portal-brand-soft)] font-medium text-[var(--portal-brand)]'
                : 'border-[var(--portal-border)] text-[var(--portal-muted)] hover:border-[var(--portal-brand)] hover:bg-transparent hover:text-[var(--portal-text)]',
              props.className
            )}
          />
        }
      >
        <CalendarDays className='size-3.5' aria-hidden='true' />
        {label}
      </PopoverTrigger>
      <PopoverContent align='end' className='w-auto p-3'>
        <Calendar
          mode='range'
          numberOfMonths={2}
          locale={calendarLocale}
          selected={selected}
          defaultMonth={props.start}
          onSelect={(next) => {
            props.onChange({ start: next?.from, end: next?.to })
            if (next?.from && next?.to) setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
