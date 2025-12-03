'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const [email, setEmail] = useState('')
  const { login, isLoading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      await login(email.trim())
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:p-6 md:p-8 bg-gradient-to-b from-christmas-snow to-christmas-cream">
      {/* Decorative elements - Hidden on mobile, visible on tablet+ */}
      <div className="hidden sm:block absolute top-10 left-10 text-4xl md:text-6xl opacity-20 select-none">🎄</div>
      <div className="hidden sm:block absolute top-20 right-20 text-3xl md:text-4xl opacity-20 select-none">⭐</div>
      <div className="hidden sm:block absolute bottom-20 left-20 text-4xl md:text-5xl opacity-20 select-none">🎁</div>
      <div className="hidden sm:block absolute bottom-10 right-10 text-4xl md:text-6xl opacity-20 select-none">❄️</div>

      <div className="w-full max-w-md space-y-6 sm:space-y-8 relative z-10">
        {/* Logo */}
        <div className="text-center">
          <span className="text-5xl sm:text-6xl md:text-7xl block mb-3 sm:mb-4">🎅</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-christmas-green">
            Christmas Planner
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted">
            Organiza los regalos de Navidad en familia
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center py-4 sm:py-6">
            <CardTitle className="text-lg sm:text-xl">Acceder</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <Input
                type="email"
                label="Tu email"
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error ?? undefined}
                required
                autoComplete="email"
                autoFocus
              />

              <Button
                type="submit"
                className="w-full min-h-[44px] text-base sm:text-lg"
                size="lg"
                isLoading={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <p className="mt-4 text-xs sm:text-sm text-center text-muted">
              Solo los miembros de la familia pueden acceder
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 text-center">
          <div className="space-y-1 sm:space-y-2">
            <span className="text-xl sm:text-2xl md:text-3xl block">📝</span>
            <p className="text-xs sm:text-sm text-muted">Crea tu lista</p>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <span className="text-xl sm:text-2xl md:text-3xl block">🎁</span>
            <p className="text-xs sm:text-sm text-muted">Asigna regalos</p>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <span className="text-xl sm:text-2xl md:text-3xl block">🤫</span>
            <p className="text-xs sm:text-sm text-muted">Mantén el secreto</p>
          </div>
        </div>
      </div>
    </main>
  )
}
