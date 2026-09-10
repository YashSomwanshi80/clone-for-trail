import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Check } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, children, ...props }, ref) => {
    const selectId = id ?? props.name
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-[12px] font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'h-9 w-full appearance-none rounded-md border border-border-soft bg-raised pl-3 pr-8 text-[13px] text-text-primary',
              'focus:outline-none focus:border-teal transition-colors',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
        </div>
      </div>
    )
  }
)
Select.displayName = 'Select'

export function Checkbox({ className, label, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const checkboxId = id ?? props.name
  return (
    <label htmlFor={checkboxId} className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          id={checkboxId}
          className={cn('peer h-4 w-4 appearance-none rounded border border-border-soft bg-raised checked:bg-teal checked:border-teal', className)}
          {...props}
        />
        <Check className="pointer-events-none absolute h-3 w-3 text-obsidian opacity-0 peer-checked:opacity-100" strokeWidth={3} />
      </span>
      {label && <span className="text-[13px] text-text-secondary">{label}</span>}
    </label>
  )
}

export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label?: string; id?: string }) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full border transition-colors',
          checked ? 'bg-teal-deep border-teal' : 'bg-raised border-border-soft'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-text-primary transition-transform',
            checked ? 'translate-x-4.5 left-0.5' : 'translate-x-0 left-0.5'
          )}
        />
      </button>
      {label && <span className="text-[13px] text-text-secondary">{label}</span>}
    </label>
  )
}
