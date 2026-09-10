import { useState, type ReactNode } from 'react'
import { ArrowUp, ArrowDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Metric({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  mono,
}: {
  label: string
  value: ReactNode
  unit?: string
  delta?: number
  deltaLabel?: string
  mono?: boolean
}) {
  const positive = (delta ?? 0) >= 0
  return (
    <div>
      <p className="text-[12px] text-text-tertiary">{label}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={cn('text-2xl font-semibold text-text-primary', mono && 'mono-data')}>{value}</span>
        {unit && <span className="text-[12px] text-text-tertiary">{unit}</span>}
      </div>
      {delta !== undefined && (
        <div className={cn('mt-1 flex items-center gap-1 text-[12px]', positive ? 'text-success' : 'text-critical')}>
          {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          <span className="mono-data">{Math.abs(delta)}%</span>
          {deltaLabel && <span className="text-text-tertiary">{deltaLabel}</span>}
        </div>
      )}
    </div>
  )
}

export function TrendValue({ value, positiveIsGood = true }: { value: number; positiveIsGood?: boolean }) {
  const positive = value >= 0
  const good = positiveIsGood ? positive : !positive
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[12px] mono-data', good ? 'text-success' : 'text-critical')}>
      {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(value)}%
    </span>
  )
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-text-tertiary">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false)
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-border-soft bg-raised px-2 py-1 text-[11px] text-text-primary shadow-lg"
        >
          {content}
        </span>
      )}
    </span>
  )
}

export function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-text-tertiary">
      {items.map((item, i) => (
        <span key={item} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          <span className={i === items.length - 1 ? 'text-text-secondary' : undefined}>{item}</span>
        </span>
      ))}
    </nav>
  )
}
