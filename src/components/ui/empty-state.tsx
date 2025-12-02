import { cn } from '@/lib/utils'

import type { HTMLAttributes, ReactNode } from 'react'

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  icon: string
  message: string
  action?: ReactNode
}

export function EmptyState({
  className,
  icon,
  message,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn('py-8 text-center', className)}
      {...props}
    >
      <span className="text-4xl block mb-2">{icon}</span>
      <p className="text-muted mb-4">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
