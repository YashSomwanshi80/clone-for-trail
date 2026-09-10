import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-teal text-obsidian hover:bg-teal-soft active:bg-teal-deep font-medium',
  secondary:
    'bg-raised text-text-primary border border-border-soft hover:bg-graphite hover:border-text-tertiary',
  ghost: 'bg-transparent text-text-secondary hover:bg-raised hover:text-text-primary',
  danger: 'bg-transparent text-critical border border-critical/40 hover:bg-critical/10',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors duration-150',
        'disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
)
Button.displayName = 'Button'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  variant?: Variant
  active?: boolean
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, variant = 'ghost', active, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors duration-150',
        'disabled:opacity-40 disabled:pointer-events-none',
        active
          ? 'bg-raised text-teal'
          : variant === 'ghost'
            ? 'text-text-secondary hover:bg-raised hover:text-text-primary'
            : variantClasses[variant],
        className
      )}
      {...props}
    />
  )
)
IconButton.displayName = 'IconButton'
