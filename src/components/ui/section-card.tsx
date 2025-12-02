import { cn } from '@/lib/utils'

import type { HTMLAttributes, ReactNode } from 'react'

type SectionCardProps = HTMLAttributes<HTMLDivElement> & {
  icon: string
  title: string
  description: string
  action?: ReactNode
  children?: ReactNode
  hover?: boolean
}

export function SectionCard({
  className,
  icon,
  title,
  description,
  action,
  children,
  hover = true,
  ...props
}: SectionCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-border p-4',
        hover && 'hover:shadow-md hover:border-christmas-green/50 transition-all',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted mt-0.5">{description}</p>
          {children}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
