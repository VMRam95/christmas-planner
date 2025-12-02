'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { Modal } from '@/components/ui/modal'
import { Avatar } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/toast'
import { BackLink } from '@/components/ui/back-link'

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
  const [newUserAvatarFile, setNewUserAvatarFile] = useState<File | null>(null)
  const [newUserAvatarPreview, setNewUserAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  })
  const [editModal, setEditModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  })
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null)
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null)
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null)

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

  // Upload avatar file
  const uploadAvatarFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload/avatar', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    if (data.success) {
      return data.data.url
    }
    throw new Error(data.error || 'Error al subir imagen')
  }

  // Handle file selection for new user
  const handleNewAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewUserAvatarFile(file)
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setNewUserAvatarPreview(previewUrl)
    }
  }

  // Clear new avatar selection
  const clearNewAvatar = () => {
    setNewUserAvatarFile(null)
    if (newUserAvatarPreview) {
      URL.revokeObjectURL(newUserAvatarPreview)
      setNewUserAvatarPreview(null)
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
      let avatarUrl: string | null = null

      // Upload avatar if file selected
      if (newUserAvatarFile) {
        setUploadingAvatar(true)
        try {
          avatarUrl = await uploadAvatarFile(newUserAvatarFile)
        } catch (err) {
          console.error('Error uploading avatar:', err)
          showToast('Error al subir la imagen', 'error')
          setActionLoading(false)
          setUploadingAvatar(false)
          return
        }
        setUploadingAvatar(false)
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim().toLowerCase(),
          avatar_url: avatarUrl,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setUsers((prev) => [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name)))
        setNewUserName('')
        setNewUserEmail('')
        clearNewAvatar()
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

  // Handle file selection for edit
  const handleEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditAvatarFile(file)
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setEditAvatarPreview(previewUrl)
    }
  }

  // Clear edit avatar selection
  const clearEditAvatar = () => {
    setEditAvatarFile(null)
    if (editAvatarPreview) {
      URL.revokeObjectURL(editAvatarPreview)
      setEditAvatarPreview(null)
    }
  }

  // Open edit modal
  const openEditModal = (familyUser: User) => {
    setEditModal({ isOpen: true, user: familyUser })
    setEditName(familyUser.name)
    setEditEmail(familyUser.email)
    setEditAvatarUrl(familyUser.avatar_url)
    setEditAvatarFile(null)
    setEditAvatarPreview(null)
  }

  // Close edit modal
  const closeEditModal = () => {
    setEditModal({ isOpen: false, user: null })
    setEditName('')
    setEditEmail('')
    setEditAvatarUrl(null)
    clearEditAvatar()
  }

  // Update user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editModal.user) return

    if (!editName.trim() || !editEmail.trim()) {
      showToast('Nombre y email son requeridos', 'error')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editEmail)) {
      showToast('Email inválido', 'error')
      return
    }

    setActionLoading(true)
    try {
      let avatarUrl = editAvatarUrl

      // Upload new avatar if file selected
      if (editAvatarFile) {
        setUploadingAvatar(true)
        try {
          avatarUrl = await uploadAvatarFile(editAvatarFile)
        } catch (err) {
          console.error('Error uploading avatar:', err)
          showToast('Error al subir la imagen', 'error')
          setActionLoading(false)
          setUploadingAvatar(false)
          return
        }
        setUploadingAvatar(false)
      }

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editModal.user.id,
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          avatar_url: avatarUrl,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setUsers((prev) =>
          prev
            .map((u) => (u.id === data.data.id ? data.data : u))
            .sort((a, b) => a.name.localeCompare(b.name))
        )
        showToast(`${data.data.name} actualizado correctamente`, 'success')
        closeEditModal()
      } else {
        showToast(data.error || 'Error al actualizar usuario', 'error')
      }
    } catch (err) {
      console.error('Error updating user:', err)
      showToast('Error al actualizar usuario', 'error')
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
        <BackLink href="/dashboard" label="Volver al dashboard" className="mb-6" />

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            🎄 Administración de Familia
          </h1>
          <p className="text-muted mt-1">
            Gestiona los miembros de tu familia navideña
          </p>
        </div>

        {/* Main section header */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            👨‍👩‍👧‍👦 Miembros de Familia
          </h2>
          <p className="text-sm text-muted mt-1">
            Agrega, edita y gestiona los miembros de tu familia
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

              <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-foreground mb-1">
                  Foto - Opcional
                </label>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  {newUserAvatarPreview ? (
                    <div className="relative">
                      <img
                        src={newUserAvatarPreview}
                        alt="Preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-christmas-green"
                      />
                      <button
                        type="button"
                        onClick={clearNewAvatar}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-christmas-red text-white rounded-full flex items-center justify-center text-xs hover:bg-christmas-red-dark"
                        disabled={actionLoading}
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                      📷
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      id="avatar"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleNewAvatarChange}
                      disabled={actionLoading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-christmas-green/10 file:text-christmas-green hover:file:bg-christmas-green/20 file:cursor-pointer cursor-pointer"
                    />
                    <p className="text-xs text-muted mt-1">
                      JPG, PNG, WebP o GIF. Máximo 2MB
                    </p>
                  </div>
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
                {uploadingAvatar ? 'Subiendo imagen...' : actionLoading ? 'Agregando...' : 'Agregar Miembro'}
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
                    className="flex items-center gap-4 p-4 bg-christmas-snow rounded-lg border border-border hover:shadow-sm transition-shadow"
                  >
                    {/* Avatar */}
                    <Avatar
                      name={familyUser.name}
                      avatarUrl={familyUser.avatar_url}
                      size="lg"
                    />

                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate">
                          {familyUser.name}
                        </h3>
                        {familyUser.email === ADMIN_EMAIL && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs bg-christmas-gold/20 text-christmas-gold-dark rounded-full">
                            👑 Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted truncate">{familyUser.email}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Invite button (visual only) */}
                      <div className="relative group">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading}
                          className="text-christmas-green hover:text-christmas-green-dark hover:bg-christmas-green/10"
                        >
                          📧 Invitar
                        </Button>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          Próximamente: enviar invitación por email
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                        </div>
                      </div>

                      {/* Edit button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(familyUser)}
                        disabled={actionLoading}
                        className="hover:bg-christmas-gold/10"
                      >
                        ✏️
                      </Button>

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteModal(familyUser)}
                        disabled={actionLoading || familyUser.email === ADMIN_EMAIL}
                        className="text-christmas-red hover:text-christmas-red-dark hover:bg-christmas-red/10"
                      >
                        🗑️
                      </Button>
                    </div>
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

      {/* Edit member modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        title="✏️ Editar Miembro"
        preventClose={actionLoading}
      >
        <form onSubmit={handleUpdateUser}>
          <div className="px-6 py-4 space-y-4">
            {/* Preview avatar */}
            {editModal.user && (
              <div className="flex justify-center">
                <Avatar
                  name={editName || editModal.user.name}
                  avatarUrl={editAvatarPreview || editAvatarUrl}
                  size="xl"
                />
              </div>
            )}

            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-foreground mb-1">
                Nombre
              </label>
              <Input
                id="edit-name"
                type="text"
                placeholder="Ej: María García"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={actionLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="edit-email" className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <Input
                id="edit-email"
                type="email"
                placeholder="Ej: maria@email.com"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                disabled={actionLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="edit-avatar" className="block text-sm font-medium text-foreground mb-1">
                Cambiar Foto - Opcional
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="edit-avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleEditAvatarChange}
                  disabled={actionLoading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-christmas-green/10 file:text-christmas-green hover:file:bg-christmas-green/20 file:cursor-pointer cursor-pointer"
                />
                {editAvatarFile && (
                  <button
                    type="button"
                    onClick={clearEditAvatar}
                    className="text-christmas-red hover:text-christmas-red-dark text-sm"
                    disabled={actionLoading}
                  >
                    Cancelar
                  </button>
                )}
              </div>
              <p className="text-xs text-muted mt-1">
                JPG, PNG, WebP o GIF. Máximo 2MB
              </p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={closeEditModal}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={actionLoading || !editName.trim() || !editEmail.trim()}
            >
              {uploadingAvatar ? 'Subiendo imagen...' : actionLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Modal>

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
