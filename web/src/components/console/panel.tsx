import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Brand surfaces for the console.
 *
 * The console reads as a set of flat panels separated by hairline dividers and
 * a 2px brand index rail, instead of a wall of floating cards with shadows and
 * colored icon tiles. Field labels are small-caps monospace; every number in a
 * panel is monospace and tabular so columns line up across rows.
 */

export function MonoLabel(props: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'font-mono text-[11px] font-medium tracking-[0.14em] text-[#3B5B93] uppercase dark:text-[#93C5FD]',
        props.className
      )}
    >
      {props.children}
    </span>
  )
}

export function MonoValue(props: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'font-mono text-sm tabular-nums text-[#17243D] dark:text-foreground',
        props.className
      )}
    >
      {props.children}
    </span>
  )
}

interface PanelProps {
  /** Small-caps monospace header label. Omit for a header-less surface. */
  label?: ReactNode
  /** Right-aligned header slot (actions, counters). */
  action?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  bodyClassName?: string
}

export function Panel(props: PanelProps) {
  return (
    <section
      className={cn(
        'border-border/70 bg-card/60 relative overflow-hidden rounded-2xl border backdrop-blur-md',
        props.className
      )}
    >
      {props.label != null && (
        <header
          className={cn(
            'border-border/60 flex items-center gap-2.5 border-b px-3.5 py-2.5',
            props.headerClassName
          )}
        >
          <span
            aria-hidden='true'
            className='h-3 w-[3px] shrink-0 rounded-full bg-[#1E3A8A] dark:bg-[#60A5FA]'
          />
          <MonoLabel>{props.label}</MonoLabel>
          {props.action != null && (
            <div className='ms-auto flex items-center gap-1.5'>
              {props.action}
            </div>
          )}
        </header>
      )}
      <div className={props.bodyClassName}>{props.children}</div>
    </section>
  )
}

/** Thin usage bar: how much of `total` is spent. */
export function MeterBar(props: {
  value: number
  total: number
  className?: string
}) {
  const ratio =
    props.total > 0 ? Math.min(1, Math.max(0, props.value / props.total)) : 0

  return (
    <span
      aria-hidden='true'
      className={cn(
        'bg-[#E4EDFA] dark:bg-white/10 relative block h-1 w-full overflow-hidden rounded-full',
        props.className
      )}
    >
      <span
        className='absolute inset-y-0 left-0 rounded-full bg-[#2563EB]'
        style={{ width: `${ratio * 100}%` }}
      />
    </span>
  )
}

/**
 * Input / output / cache as one stacked bar: the shape of a request is visible
 * at a glance instead of three numbers to compare by hand.
 */
export function TokenSplitBar(props: {
  input: number
  output: number
  cache: number
  className?: string
}) {
  const total = props.input + props.output + props.cache
  if (total <= 0) {
    return <span className='text-muted-foreground font-mono text-xs'>-</span>
  }

  const segments = [
    { key: 'input', value: props.input, className: 'bg-[#1E3A8A]' },
    { key: 'output', value: props.output, className: 'bg-[#2563EB]' },
    { key: 'cache', value: props.cache, className: 'bg-[#BFD7F5]' },
  ].filter((segment) => segment.value > 0)

  return (
    <span
      className={cn(
        'flex h-1 w-full overflow-hidden rounded-full bg-[#E4EDFA] dark:bg-white/10',
        props.className
      )}
    >
      {segments.map((segment) => (
        <span
          key={segment.key}
          className={segment.className}
          style={{ width: `${(segment.value / total) * 100}%` }}
        />
      ))}
    </span>
  )
}
