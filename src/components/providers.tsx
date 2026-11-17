'use client'

import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/components/ui/toast'
import type { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return <ToastProvider><AuthProvider>{children}</AuthProvider></ToastProvider>
}
