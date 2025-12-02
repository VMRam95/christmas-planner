import { cn } from '@/lib/utils'

import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border border-border',
        'overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

type CardHeaderProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('px-6 py-4 border-b border-border', className)}
      {...props}
    >
      {children}
    </div>
  )
}

type CardTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  children: ReactNode
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn('text-lg font-semibold text-foreground', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

type CardContentProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  )
}

type CardFooterProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn('px-6 py-4 border-t border-border bg-gray-50/50', className)}
      {...props}
    >
      {children}
    </div>
  )
}
