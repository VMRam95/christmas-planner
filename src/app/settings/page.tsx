'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { BackLink } from '@/components/ui/back-link'

import type { UserPreferences } from '@/types'

export default function SettingsPage() {
  const router = useRouter()
  const { isLoading: authLoading, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch preferences
  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences()
    }
  }, [isAuthenticated])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      if (data.success) {
        setPreferences(data.data)
        setEmailNotifications(data.data.email_notifications_enabled)
      } else {
        showToast(data.error || 'Error al cargar preferencias', 'error')
      }
    } catch (err) {
      console.error('Error fetching preferences:', err)
      showToast('Error al cargar preferencias', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_notifications_enabled: emailNotifications,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setPreferences(data.data)
        showToast('Preferencias guardadas correctamente', 'success')
      } else {
        showToast(data.error || 'Error al guardar preferencias', 'error')
      }
    } catch (err) {
      console.error('Error saving preferences:', err)
      showToast('Error al guardar preferencias', 'error')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = preferences?.email_notifications_enabled !== emailNotifications

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl animate-bounce block">🎄</span>
          <p className="mt-2 text-muted">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <BackLink href="/dashboard" label="Volver al dashboard" className="mb-4 sm:mb-6" />

        {/* Page header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground flex items-center gap-2">
            ⚙️ Ajustes
          </h1>
          <p className="text-sm sm:text-base text-muted mt-1">
            Configura tus preferencias de la aplicacion
          </p>
        </div>

        {/* Notifications section */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              🔔 Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Email notifications toggle */}
              <div className="flex items-start sm:items-center justify-between gap-4 p-4 bg-christmas-snow rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📧</span>
                    <h3 className="font-medium text-sm sm:text-base text-foreground">
                      Notificaciones por email
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-muted">
                    Recibe un email cuando un miembro de la familia añada un nuevo regalo a su carta
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="sr-only peer"
                    disabled={saving}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-christmas-green/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-christmas-green"></div>
                </label>
              </div>

              {/* Info text */}
              <div className="flex items-start gap-2 p-3 bg-christmas-gold/10 rounded-lg border border-christmas-gold/20">
                <span className="text-lg flex-shrink-0">💡</span>
                <p className="text-xs sm:text-sm text-christmas-gold-dark">
                  Cuando alguien de tu familia añada un regalo a su carta, recibiras un email con los
                  detalles y un enlace directo para ver su lista de deseos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px]"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>

        {/* Unsaved changes indicator */}
        {hasChanges && (
          <p className="mt-3 text-xs sm:text-sm text-christmas-gold-dark text-center sm:text-right">
            ⚠️ Tienes cambios sin guardar
          </p>
        )}
      </main>
    </div>
  )
}
