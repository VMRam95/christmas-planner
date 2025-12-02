'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import type { User } from '@/types'

type AuthState = {
  user: User | null
  isLoading: boolean
  error: string | null
}

export function useAuth() {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  })

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth')
      const data = await response.json()

      if (data.success && data.data.user) {
        setState({ user: data.data.user, isLoading: false, error: null })
      } else {
        setState({ user: null, isLoading: false, error: null })
      }
    } catch {
      setState({ user: null, isLoading: false, error: 'Error al verificar sesión' })
    }
  }, [])

  const login = useCallback(async (email: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setState({ user: data.data.user, isLoading: false, error: null })
        router.push('/dashboard')
        return true
      } else {
        setState({ user: null, isLoading: false, error: data.error })
        return false
      }
    } catch {
      setState({ user: null, isLoading: false, error: 'Error al iniciar sesión' })
      return false
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' })
      setState({ user: null, isLoading: false, error: null })
      router.push('/')
    } catch {
      console.error('Error al cerrar sesión')
    }
  }, [router])

  return {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    isAuthenticated: !!state.user,
    login,
    logout,
    checkSession,
  }
}
