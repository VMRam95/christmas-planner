import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          {...props}
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={[props['aria-describedby'], error ? `${inputId}-error` : undefined].filter(Boolean).join(' ') || undefined}
          className={cn(
            'w-full px-4 py-3 rounded-xl',
            'border border-border bg-white',
            'text-foreground placeholder:text-muted',
            'focus:outline-none focus:ring-2 focus:ring-christmas-green focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
        />
        {error && <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
