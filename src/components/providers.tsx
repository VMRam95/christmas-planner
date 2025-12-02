'use client'

import { ToastProvider } from '@/components/ui/toast'
import type { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return <ToastProvider>{children}</ToastProvider>
}
