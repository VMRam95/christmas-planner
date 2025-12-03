'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { BackLink } from '@/components/ui/back-link'

import type { UserPreferences } from '@/types'

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated, checkSession } = useAuth()
  const { showToast } = useToast()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)

  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

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

  // Avatar handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      showToast('Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF', 'error')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      showToast('El archivo es muy grande. Maximo 2MB', 'error')
      return
    }

    setSelectedFile(file)
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
  }

  const handleUploadAvatar = async () => {
    if (!selectedFile) return

    setUploadingAvatar(true)
    try {
      // First, upload the file
      const formData = new FormData()
      formData.append('file', selectedFile)

      const uploadResponse = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadResponse.json()
      if (!uploadData.success) {
        showToast(uploadData.error || 'Error al subir imagen', 'error')
        return
      }

      // Then, update the user's avatar_url
      const updateResponse = await fetch('/api/profile/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: uploadData.data.url }),
      })

      const updateData = await updateResponse.json()
      if (updateData.success) {
        showToast('Foto de perfil actualizada', 'success')
        setSelectedFile(null)
        setAvatarPreview(null)
        // Refresh user session to get updated avatar
        checkSession()
      } else {
        showToast(updateData.error || 'Error al actualizar perfil', 'error')
      }
    } catch (err) {
      console.error('Error uploading avatar:', err)
      showToast('Error al subir imagen', 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user?.avatar_url) return

    setUploadingAvatar(true)
    try {
      // Delete from storage
      await fetch(`/api/upload/avatar?url=${encodeURIComponent(user.avatar_url)}`, {
        method: 'DELETE',
      })

      // Update user profile
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        showToast('Foto de perfil eliminada', 'success')
        checkSession()
      } else {
        showToast(data.error || 'Error al eliminar foto', 'error')
      }
    } catch (err) {
      console.error('Error removing avatar:', err)
      showToast('Error al eliminar foto', 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCancelPreview = () => {
    setSelectedFile(null)
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
      setAvatarPreview(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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

  const displayAvatar = avatarPreview || user?.avatar_url

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

        {/* Profile photo section */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              📷 Foto de perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar preview */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-christmas-snow border-4 border-christmas-green/20 flex items-center justify-center">
                  {displayAvatar ? (
                    <Image
                      src={displayAvatar}
                      alt="Avatar"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl sm:text-5xl">
                      {user?.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                {avatarPreview && (
                  <div className="absolute -top-1 -right-1 bg-christmas-gold text-white text-xs px-2 py-0.5 rounded-full">
                    Preview
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 flex-1">
                <p className="text-sm text-muted text-center sm:text-left">
                  Tu foto de perfil sera visible para todos los miembros de la familia.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {avatarPreview ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleUploadAvatar}
                      disabled={uploadingAvatar}
                      className="flex-1"
                    >
                      {uploadingAvatar ? 'Guardando...' : 'Guardar foto'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelPreview}
                      disabled={uploadingAvatar}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="flex-1"
                    >
                      {user?.avatar_url ? 'Cambiar foto' : 'Subir foto'}
                    </Button>
                    {user?.avatar_url && (
                      <Button
                        variant="ghost"
                        onClick={handleRemoveAvatar}
                        disabled={uploadingAvatar}
                        className="text-christmas-red hover:text-christmas-red hover:bg-christmas-red/10"
                      >
                        {uploadingAvatar ? 'Eliminando...' : 'Eliminar'}
                      </Button>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted text-center sm:text-left">
                  JPG, PNG, WebP o GIF. Maximo 2MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
