'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type GiftFormData = {
  title: string
  description: string
  url: string
  priority?: number
}

type GiftFormProps = {
  // Initial values for editing
  initialData?: GiftFormData
  // Whether to show priority selector (for wishes)
  showPriority?: boolean
  // Form mode
  mode?: 'wish' | 'surprise'
  // Callbacks
  onSubmit: (data: GiftFormData) => Promise<void>
  onCancel?: () => void
  // UI customization
  title?: string
  subtitle?: string
  submitLabel?: string
  isLoading?: boolean
}

export function GiftForm({
  initialData,
  showPriority = true,
  mode = 'wish',
  onSubmit,
  onCancel,
  title: formTitle,
  subtitle,
  submitLabel,
  isLoading = false,
}: GiftFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [url, setUrl] = useState(initialData?.url || '')
  const [priority, setPriority] = useState<number>(initialData?.priority || 2)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initialData

  // Default titles based on mode
  const defaultTitle = isEditing
    ? mode === 'wish' ? '✏️ Editar deseo' : '✏️ Editar regalo sorpresa'
    : mode === 'wish' ? '➕ Añadir deseo' : '🎉 Añadir regalo sorpresa'

  const defaultSubmitLabel = isEditing ? 'Guardar cambios' : mode === 'wish' ? 'Añadir a mi carta' : 'Añadir regalo'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('El título es requerido')
      return
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        url: url.trim(),
        ...(showPriority && { priority }),
      })
      if (!isEditing) {
        // Clear form after creating
        setTitle('')
        setDescription('')
        setUrl('')
        setPriority(2)
      }
    } catch {
      setError('Error al guardar')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {formTitle || defaultTitle}
        </CardTitle>
        {subtitle && (
          <p className="text-sm text-muted">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={mode === 'wish' ? '¿Qué te gustaría recibir?' : '¿Qué vas a regalar?'}
            placeholder={mode === 'wish' ? 'Ej: Auriculares Bluetooth' : 'Ej: Libro de cocina'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={error ?? undefined}
            required
            disabled={isLoading}
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Descripción (opcional)
            </label>
            <textarea
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-christmas-green focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 resize-none"
              placeholder="Añade detalles: color, marca, modelo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>

          <Input
            label="Enlace (opcional)"
            type="url"
            placeholder="https://ejemplo.com/producto"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
          />

          {showPriority && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Prioridad
              </label>
              <div className="flex gap-2">
                {[
                  { value: 1, label: 'Baja', emoji: '😊' },
                  { value: 2, label: 'Media', emoji: '🙏' },
                  { value: 3, label: 'Alta', emoji: '🤩' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    disabled={isLoading}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      priority === opt.value
                        ? 'border-christmas-green bg-christmas-green/10 text-christmas-green-dark'
                        : 'border-border hover:border-christmas-green/50'
                    } disabled:opacity-50`}
                  >
                    {opt.emoji} {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              {submitLabel || defaultSubmitLabel}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
