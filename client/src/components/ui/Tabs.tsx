import { cn } from '@/lib/utils'

export interface TabItem {
  value: string
  label: string
  count?: number
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[]
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <div role="tablist" className={cn('flex items-center gap-1 border-b border-border-soft', className)}>
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors',
              active ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] leading-none',
                  active ? 'bg-teal/15 text-teal' : 'bg-raised text-text-tertiary'
                )}
              >
                {item.count}
              </span>
            )}
            {active && <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-teal" />}
          </button>
        )
      })}
    </div>
  )
}
