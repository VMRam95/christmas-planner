'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { WishForm } from '@/components/wishes/WishForm'
import { WishCard } from '@/components/wishes/WishCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { Wish } from '@/types'

export default function MyWishesPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [editingWish, setEditingWish] = useState<Wish | null>(null)

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
      }
    } catch (error) {
      console.error('Error fetching wishes:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishes()
    }
  }, [isAuthenticated, fetchWishes])

  // Create wish
  const handleCreate = async (data: { title: string; description: string; url: string; priority: number }) => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (result.success) {
        setWishes((prev) => [result.data, ...prev])
      }
    } finally {
      setActionLoading(false)
    }
  }

  // Update wish
  const handleUpdate = async (data: { title: string; description: string; url: string; priority: number }) => {
    if (!editingWish) return
    setActionLoading(true)
    try {
      const response = await fetch('/api/wishes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingWish.id, ...data }),
      })
      const result = await response.json()
      if (result.success) {
        setWishes((prev) =>
          prev.map((w) => (w.id === editingWish.id ? result.data : w))
        )
        setEditingWish(null)
      }
    } finally {
      setActionLoading(false)
    }
  }

  // Delete wish
  const handleDelete = async (wish: Wish) => {
    if (!confirm(`¿Seguro que quieres eliminar "${wish.title}"?`)) return
    setActionLoading(true)
    try {
      const response = await fetch(`/api/wishes?id=${wish.id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        setWishes((prev) => prev.filter((w) => w.id !== wish.id))
      }
    } finally {
      setActionLoading(false)
    }
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
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            📝 Mi Carta a los Reyes
          </h1>
          <p className="text-muted mt-1">
            Añade lo que te gustaría recibir esta Navidad, {user?.name}
          </p>
        </div>

        {/* Form section */}
        <div className="mb-8">
          {editingWish ? (
            <WishForm
              wish={editingWish}
              onSubmit={handleUpdate}
              onCancel={() => setEditingWish(null)}
              isLoading={actionLoading}
            />
          ) : (
            <WishForm onSubmit={handleCreate} isLoading={actionLoading} />
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
                  <WishCard
                    key={wish.id}
                    wish={wish}
                    isOwner
                    onEdit={setEditingWish}
                    onDelete={handleDelete}
                    isLoading={actionLoading}
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
    </div>
  )
}
