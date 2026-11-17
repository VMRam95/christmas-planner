'use client'

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

import type { User } from '@/types'

type AuthState = {
  user: User | null
  isLoading: boolean
  error: string | null
}

function useAuthState() {
  const router = useRouter()
  const { showToast } = useToast()
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  })

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

  useEffect(() => { void checkSession() }, [checkSession])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
      const response = await fetch('/api/auth', { method: 'DELETE' })
      if (!response.ok) throw new Error('No se pudo cerrar la sesión')
      setState({ user: null, isLoading: false, error: null })
      router.push('/')
    } catch {
      showToast('No se pudo cerrar la sesión. Inténtalo de nuevo.', 'error')
    }
  }, [router, showToast])

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

const AuthContext = createContext<ReturnType<typeof useAuthState> | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthState()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('AuthProvider is required')
  return auth
}
