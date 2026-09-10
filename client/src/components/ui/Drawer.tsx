import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from './Button'
import { cn } from '@/lib/utils'

export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children?: ReactNode
  width?: 'sm' | 'md' | 'lg'
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-obsidian/70" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative h-full overflow-y-auto border-l border-border-soft bg-deep-graphite shadow-2xl',
          width === 'sm' && 'w-full max-w-sm',
          width === 'md' && 'w-full max-w-md',
          width === 'lg' && 'w-full max-w-xl'
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-soft bg-deep-graphite px-5 py-4">
          <h2 className="text-[15px] font-medium text-text-primary">{title}</h2>
          <IconButton label="Close panel" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  )
}
