import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastTone = 'success' | 'error' | 'info'
interface Toast {
  id: number
  tone: ToastTone
  message: string
}

interface ToastContextValue {
  push: (tone: ToastTone, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}
const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'border-success/40 text-success',
  error: 'border-critical/40 text-critical',
  info: 'border-info/40 text-info',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((tone: ToastTone, message: string) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, tone, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80" role="region" aria-live="polite">
          {toasts.map((t) => {
            const Icon = ICONS[t.tone]
            return (
              <div
                key={t.id}
                className={cn(
                  'flex items-start gap-2 rounded-lg border bg-graphite px-3.5 py-3 shadow-xl',
                  TONE_CLASSES[t.tone]
                )}
              >
                <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="flex-1 text-[13px] text-text-primary">{t.message}</p>
                <button aria-label="Dismiss notification" onClick={() => dismiss(t.id)} className="text-text-tertiary hover:text-text-primary">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
