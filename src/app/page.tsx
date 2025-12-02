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
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-christmas-snow to-christmas-cream">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 text-6xl opacity-20 select-none">🎄</div>
      <div className="absolute top-20 right-20 text-4xl opacity-20 select-none">⭐</div>
      <div className="absolute bottom-20 left-20 text-5xl opacity-20 select-none">🎁</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-20 select-none">❄️</div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo */}
        <div className="text-center">
          <span className="text-7xl block mb-4">🎅</span>
          <h1 className="text-3xl font-bold text-christmas-green">
            Christmas Planner
          </h1>
          <p className="mt-2 text-muted">
            Organiza los regalos de Navidad en familia
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Acceder</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <p className="mt-4 text-xs text-center text-muted">
              Solo los miembros de la familia pueden acceder
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div className="space-y-1">
            <span className="text-2xl block">📝</span>
            <p className="text-muted">Crea tu lista</p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl block">🎁</span>
            <p className="text-muted">Asigna regalos</p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl block">🤫</span>
            <p className="text-muted">Mantén el secreto</p>
          </div>
        </div>
      </div>
    </main>
  )
}
