import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border-soft bg-graphite',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({
  icon,
  title,
  unit,
  action,
  subtitle,
}: {
  icon?: ReactNode
  title: ReactNode
  unit?: string
  action?: ReactNode
  subtitle?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon && <span className="text-text-tertiary shrink-0">{icon}</span>}
          <h3 className="text-[13px] font-medium text-text-primary truncate">{title}</h3>
          {unit && (
            <span className="text-[11px] text-text-tertiary mono-data border-l border-border-soft pl-2 ml-0.5">
              {unit}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-0.5 text-[12px] text-text-tertiary">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 pb-4 pt-3', className)} {...props} />
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-border-soft bg-deep-graphite', className)}
      {...props}
    />
  )
}
