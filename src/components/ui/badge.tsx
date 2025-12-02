import { cn } from '@/lib/utils'

import type { HTMLAttributes, ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
  children: ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-christmas-green/20 text-christmas-green-dark',
  warning: 'bg-christmas-gold/20 text-christmas-gold-dark',
  error: 'bg-christmas-red/20 text-christmas-red',
  info: 'bg-blue-100 text-blue-700',
}

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full',
        'text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
