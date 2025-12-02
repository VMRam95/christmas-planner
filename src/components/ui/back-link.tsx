import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BackLinkProps {
  href: string
  label?: string
  className?: string
}

export function BackLink({ href, label = 'Volver', className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 text-muted hover:text-christmas-green transition-colors group',
        className
      )}
    >
      <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span>
      <span>{label}</span>
    </Link>
  )
}
