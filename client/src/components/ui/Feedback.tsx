import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Inbox, AlertCircle, RotateCw } from 'lucide-react'
import { Button } from './Button'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-raised', className)} />
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border-soft bg-graphite p-4 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-16 w-full" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 px-6 text-center">
      <div className="mb-1 text-text-tertiary">{icon ?? <Inbox className="h-7 w-7" />}</div>
      <p className="text-[13px] font-medium text-text-primary">{title}</p>
      {description && <p className="text-[12px] text-text-tertiary max-w-xs">{description}</p>}
      {action && (
        <Button size="sm" variant="secondary" className="mt-2" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 px-6 text-center">
      <AlertCircle className="h-7 w-7 text-critical mb-1" />
      <p className="text-[13px] font-medium text-text-primary">Something went wrong</p>
      <p className="text-[12px] text-text-tertiary max-w-xs">{message}</p>
      {onRetry && (
        <Button size="sm" variant="secondary" className="mt-2" onClick={onRetry}>
          <RotateCw className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </div>
  )
}
