'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { GiftForm, GiftCard } from '@/components/gifts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BackLink } from '@/components/ui/back-link'
import { useToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'

import type { Wish, SurpriseGift } from '@/types'

export default function MyWishesPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [editingWish, setEditingWish] = useState<Wish | null>(null)

  // State for delete confirmation modal
  const [wishToDelete, setWishToDelete] = useState<Wish | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch wishes
  const fetchWishes = useCallback(async () => {
    try {
      const response = await fetch('/api/wishes')
      const data = await response.json()
      if (data.success) {
        setWishes(data.data)
      } else {
        showToast('Error al cargar los deseos', 'error')
      }
    } catch (error) {
      console.error('Error fetching wishes:', error)
      showToast('Error al cargar los deseos', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishes()
    }
  }, [isAuthenticated, fetchWishes])

  // Create wish
  const handleCreate = async (data: { title: string; description: string; url: string; priority?: number }) => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, priority: data.priority ?? 2 }),
      })
      const result = await response.json()
      if (result.success) {
        setWishes((prev) => [result.data, ...prev])
        showToast('Deseo añadido a tu carta', 'success')
      } else {
        showToast(result.error || 'Error al crear el deseo', 'error')
      }
    } catch (error) {
      console.error('Error creating wish:', error)
      showToast('Error al crear el deseo', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Update wish
  const handleUpdate = async (data: { title: string; description: string; url: string; priority?: number }) => {
    if (!editingWish) return
    setActionLoading(true)
    try {
      const response = await fetch('/api/wishes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingWish.id, ...data, priority: data.priority ?? editingWish.priority }),
      })
      const result = await response.json()
      if (result.success) {
        setWishes((prev) =>
          prev.map((w) => (w.id === editingWish.id ? result.data : w))
        )
        setEditingWish(null)
        showToast('Deseo actualizado correctamente', 'success')
      } else {
        showToast(result.error || 'Error al actualizar el deseo', 'error')
      }
    } catch (error) {
      console.error('Error updating wish:', error)
      showToast('Error al actualizar el deseo', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Delete wish - now using modal
  const handleDeleteClick = (wish: Wish) => {
    setWishToDelete(wish)
  }

  const handleDeleteConfirm = async () => {
    if (!wishToDelete) return
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/wishes?id=${wishToDelete.id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        setWishes((prev) => prev.filter((w) => w.id !== wishToDelete.id))
        showToast('Deseo eliminado de tu carta', 'success')
        setWishToDelete(null)
      } else {
        showToast(result.error || 'Error al eliminar el deseo', 'error')
      }
    } catch (error) {
      console.error('Error deleting wish:', error)
      showToast('Error al eliminar el deseo', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Wrappers for GiftCard's wider type callbacks
  const handleEditWrapper = (gift: Wish | SurpriseGift) => {
    setEditingWish(gift as Wish)
  }

  const handleDeleteWrapper = (gift: Wish | SurpriseGift) => {
    handleDeleteClick(gift as Wish)
  }

  if (authLoading) {
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <BackLink href="/dashboard" label="Volver al dashboard" className="mb-6" />

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            📝 Mi Carta a los Reyes
          </h1>
          <p className="text-muted mt-1">
            Añade lo que te gustaría recibir esta Navidad, {user?.name}
          </p>
        </div>

        {/* Form section - key prop forces remount when switching between create/edit */}
        <div className="mb-8">
          {editingWish ? (
            <GiftForm
              key={`edit-${editingWish.id}`}
              mode="wish"
              initialData={{
                title: editingWish.title,
                description: editingWish.description || '',
                url: editingWish.url || '',
                priority: editingWish.priority,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditingWish(null)}
              isLoading={actionLoading}
            />
          ) : (
            <GiftForm
              key="create-new"
              mode="wish"
              onSubmit={handleCreate}
              isLoading={actionLoading}
            />
          )}
        </div>

        {/* Wishes list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🎁 Mis deseos ({wishes.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted">
                Cargando tus deseos...
              </div>
            ) : wishes.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-4xl block mb-2">📭</span>
                <p className="text-muted">Tu carta está vacía</p>
                <p className="text-sm text-muted mt-1">
                  ¡Añade tu primer deseo arriba!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {wishes.map((wish) => (
                  <GiftCard
                    key={wish.id}
                    gift={wish}
                    type="wish"
                    isOwner
                    onEdit={handleEditWrapper}
                    onDelete={handleDeleteWrapper}
                    isLoading={actionLoading || deleteLoading}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info note */}
        <p className="mt-4 text-xs text-center text-muted">
          🤫 No te preocupes, no podrás ver quién te regala cada cosa
        </p>
      </main>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!wishToDelete}
        onClose={() => setWishToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar deseo"
        message={`¿Seguro que quieres eliminar "${wishToDelete?.title}" de tu carta?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  )
}
