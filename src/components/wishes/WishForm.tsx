'use client'
import { giftError } from '@/lib/validation'

import { useState, useId } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { Wish } from '@/types'

type WishFormProps = {
  wish?: Wish
  onSubmit: (data: { title: string; description: string; url: string; priority: number }) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function WishForm({ wish, onSubmit, onCancel, isLoading = false }: WishFormProps) {
  const descriptionId = useId()
  const [title, setTitle] = useState(wish?.title || '')
  const [description, setDescription] = useState(wish?.description || '')
  const [url, setUrl] = useState(wish?.url || '')
  const [priority, setPriority] = useState<number>(wish?.priority || 2)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!wish

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const validationError = giftError({ title, description, url, priority })
    if (validationError) { setError(validationError); return }

    if (!title.trim()) {
      setError('El título es requerido')
      return
    }

    try {
      await onSubmit({ title, description, url, priority })
      if (!isEditing) {
        // Clear form after creating new wish
        setTitle('')
        setDescription('')
        setUrl('')
        setPriority(2)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar el deseo')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {isEditing ? '✏️ Editar deseo' : '➕ Añadir deseo'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <Input
            label="¿Qué te gustaría recibir?"
            placeholder="Ej: Auriculares Bluetooth"
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isLoading}
          />

          <div>
            <label htmlFor={descriptionId} className="block text-sm font-medium text-foreground mb-1.5">
              Descripción (opcional)
            </label>
            <textarea
              id={descriptionId}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-christmas-green focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 resize-none"
              placeholder="Añade detalles: color, marca, modelo..."
              maxLength={2000}
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
            maxLength={2048}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
          />

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
                    aria-pressed={priority === opt.value}
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

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              {isEditing ? 'Guardar cambios' : 'Añadir a mi carta'}
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
