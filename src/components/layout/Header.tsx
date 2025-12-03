'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const isAdmin = user?.email === 'victor.95.manuel@gmail.com'

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
            <span className="text-2xl">🎄</span>
            <span className="font-bold text-christmas-green text-lg hidden sm:inline">
              Christmas Planner
            </span>
          </Link>

          {/* Navigation */}
          {isAuthenticated && (
            <nav className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted hover:text-christmas-green transition-colors"
              >
                Familia
              </Link>
              <Link
                href="/my-wishes"
                className="text-sm font-medium text-muted hover:text-christmas-green transition-colors"
              >
                Mi Carta
              </Link>
              <Link
                href="/settings"
                className="text-sm font-medium text-muted hover:text-christmas-green transition-colors"
              >
                Ajustes
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-muted hover:text-christmas-green transition-colors"
                >
                  👑 Admin
                </Link>
              )}
            </nav>
          )}

          {/* User section */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted hidden sm:inline">
                {user?.name}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Salir
              </Button>
            </div>
          ) : (
            <div className="w-20" /> // Spacer for alignment
          )}
        </div>
      </div>
    </header>
  )
}
