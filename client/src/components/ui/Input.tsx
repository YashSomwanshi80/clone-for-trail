import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Search, X, Loader2 } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? props.name
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[12px] font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-9 rounded-md border bg-raised px-3 text-[13px] text-text-primary placeholder:text-text-tertiary',
            'transition-colors focus:outline-none focus-visible:outline-none',
            error ? 'border-critical' : 'border-border-soft focus:border-teal',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <span id={`${inputId}-error`} className="text-[11px] text-critical">
            {error}
          </span>
        )}
        {!error && hint && (
          <span id={`${inputId}-hint`} className="text-[11px] text-text-tertiary">
            {hint}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  placeholder?: string
  loading?: boolean
  className?: string
  autoFocus?: boolean
  ['aria-label']?: string
}

export function SearchInput({ value, onChange, onSubmit, placeholder, loading, className, autoFocus, ...aria }: SearchInputProps) {
  return (
    <div
      className={cn(
        'flex h-9 items-center gap-2 rounded-md border border-border-soft bg-raised px-3 text-[13px] text-text-primary',
        'focus-within:border-teal transition-colors',
        className
      )}
    >
      <Search className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit?.()
        }}
        placeholder={placeholder}
        aria-label={aria['aria-label'] ?? placeholder}
        className="flex-1 bg-transparent outline-none placeholder:text-text-tertiary min-w-0"
      />
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-text-tertiary shrink-0" />
      ) : (
        value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onChange('')}
            className="text-text-tertiary hover:text-text-primary shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )
      )}
    </div>
  )
}
