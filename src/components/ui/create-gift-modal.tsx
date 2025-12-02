'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

import type { User } from '@/types'

interface CreateGiftModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  familyMembers: User[]
  currentUserId: string
}

export function CreateGiftModal({
  isOpen,
  onClose,
  onSuccess,
  familyMembers,
  currentUserId,
}: CreateGiftModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    recipient_id: '',
  })

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        url: '',
        recipient_id: '',
      })
      setError(null)
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, loading, onClose])

  // Focus trap and prevent scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      modalRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('El título es requerido')
      return
    }

    if (!formData.recipient_id) {
      setError('Debes seleccionar un destinatario')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/surprise-gifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_id: formData.recipient_id,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          url: formData.url.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
        onClose()
      } else {
        setError(data.error || 'Error al crear el regalo')
      }
    } catch (err) {
      console.error('Error creating gift:', err)
      setError('Error al crear el regalo')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Filter out current user from recipients
  const availableRecipients = familyMembers.filter(
    (member) => member.id !== currentUserId
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scale-in max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-foreground"
          >
            🎁 Crear Regalo
          </h2>
          <p className="text-sm text-muted mt-1">
            Crea un regalo para un miembro de tu familia
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {/* Title */}
            <div>
              <label
                htmlFor="gift-title"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Título <span className="text-christmas-red">*</span>
              </label>
              <input
                id="gift-title"
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ej: Libro de cocina, Videojuego..."
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-green"
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="gift-description"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Descripción (opcional)
              </label>
              <textarea
                id="gift-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Detalles adicionales sobre el regalo..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-green resize-none"
                disabled={loading}
              />
            </div>

            {/* URL */}
            <div>
              <label
                htmlFor="gift-url"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Enlace (opcional)
              </label>
              <input
                id="gift-url"
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="https://ejemplo.com/producto"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-green"
                disabled={loading}
              />
            </div>

            {/* Recipient */}
            <div>
              <label
                htmlFor="gift-recipient"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Para quién <span className="text-christmas-red">*</span>
              </label>
              <select
                id="gift-recipient"
                value={formData.recipient_id}
                onChange={(e) =>
                  setFormData({ ...formData, recipient_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-green"
                disabled={loading}
              >
                <option value="">Selecciona un destinatario</option>
                {availableRecipients.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-christmas-red/10 border border-christmas-red/20">
                <p className="text-sm text-christmas-red">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Regalo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
