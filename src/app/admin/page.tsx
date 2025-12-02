'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { useToast } from '@/components/ui/toast'

import type { User } from '@/types'

const ADMIN_EMAIL = 'victor.95.manuel@gmail.com'

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [error, setError] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  })

  // Check if current user is admin
  const isAdmin = user?.email === ADMIN_EMAIL

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/')
      } else if (!isAdmin) {
        router.push('/dashboard')
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router])

  // Fetch users
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers()
    }
  }, [isAuthenticated, isAdmin])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      } else {
        setError(data.error || 'Error al cargar usuarios')
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  // Add new user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!newUserName.trim() || !newUserEmail.trim()) {
      setError('Nombre y email son requeridos')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUserEmail)) {
      setError('Email inválido')
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim().toLowerCase(),
        }),
      })

      const data = await response.json()
      if (data.success) {
        setUsers((prev) => [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name)))
        setNewUserName('')
        setNewUserEmail('')
        showToast(`${data.data.name} agregado correctamente`, 'success')
      } else {
        showToast(data.error || 'Error al agregar usuario', 'error')
      }
    } catch (err) {
      console.error('Error adding user:', err)
      showToast('Error al agregar usuario', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Open delete confirmation modal
  const openDeleteModal = (familyUser: User) => {
    setDeleteModal({ isOpen: true, user: familyUser })
  }

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, user: null })
  }

  // Delete user (called after modal confirmation)
  const handleDeleteUser = async () => {
    if (!deleteModal.user) return

    const { id: userId, name: userName } = deleteModal.user

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        showToast(`${userName} eliminado correctamente`, 'success')
        closeDeleteModal()
      } else {
        showToast(data.error || 'Error al eliminar usuario', 'error')
      }
    } catch (err) {
      console.error('Error deleting user:', err)
      showToast('Error al eliminar usuario', 'error')
    } finally {
      setActionLoading(false)
    }
  }

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

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            👨‍👩‍👧‍👦 Administración de Familia
          </h1>
          <p className="text-muted mt-1">
            Gestiona los miembros de tu familia navideña
          </p>
        </div>

        {/* Add user form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>➕ Agregar Miembro</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                    Nombre
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ej: María García"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    disabled={actionLoading}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ej: maria@email.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    disabled={actionLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-christmas-red/10 border border-christmas-red/20 rounded-lg">
                  <p className="text-sm text-christmas-red">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={actionLoading || !newUserName.trim() || !newUserEmail.trim()}
                className="w-full sm:w-auto"
              >
                {actionLoading ? 'Agregando...' : 'Agregar Miembro'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Users list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>👥 Miembros de la Familia</span>
              <span className="text-sm font-normal text-muted">
                Total: {users.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-4xl block mb-2">👨‍👩‍👧‍👦</span>
                <p className="text-muted">No hay miembros registrados</p>
                <p className="text-sm text-muted mt-1">
                  Agrega el primer miembro arriba
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((familyUser) => (
                  <div
                    key={familyUser.id}
                    className="flex items-center justify-between p-4 bg-christmas-snow rounded-lg border border-border hover:shadow-sm transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        <div>
                          <h3 className="font-medium text-foreground">
                            {familyUser.name}
                          </h3>
                          <p className="text-sm text-muted">{familyUser.email}</p>
                        </div>
                      </div>
                      {familyUser.email === ADMIN_EMAIL && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-christmas-gold/20 text-christmas-gold-dark rounded-full">
                          👑 Admin
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteModal(familyUser)}
                      disabled={actionLoading || familyUser.email === ADMIN_EMAIL}
                      className="text-christmas-red hover:text-christmas-red-dark hover:bg-christmas-red/10"
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info note */}
        <p className="mt-4 text-xs text-center text-muted">
          ℹ️ Los miembros eliminados perderán acceso a sus deseos y asignaciones
        </p>
      </main>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteUser}
        title="Eliminar miembro"
        message={`¿Estás seguro de que quieres eliminar a "${deleteModal.user?.name}"? Esta acción eliminará todos sus deseos y asignaciones.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  )
}
