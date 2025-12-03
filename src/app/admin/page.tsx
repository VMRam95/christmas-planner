'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import emailjs from '@emailjs/browser'
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
  const [inviteModal, setInviteModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  })
  const [sendingInvite, setSendingInvite] = useState(false)

  // App URL (placeholder for Vercel deployment)
  const APP_URL = 'https://christmas-planner.vercel.app'

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

  // Open invite modal
  const openInviteModal = (familyUser: User) => {
    setInviteModal({ isOpen: true, user: familyUser })
  }

  // Close invite modal
  const closeInviteModal = () => {
    setInviteModal({ isOpen: false, user: null })
  }

  // Copy email text to clipboard
  const copyEmailToClipboard = () => {
    if (!inviteModal.user) return
    const emailText = getInviteEmailText(inviteModal.user)
    navigator.clipboard.writeText(emailText)
    showToast('Texto copiado al portapapeles', 'success')
  }

  // Send invite email via EmailJS
  const handleSendInvite = async () => {
    if (!inviteModal.user) return

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

    if (!serviceId || !templateId || !publicKey) {
      showToast('Error: EmailJS no está configurado', 'error')
      return
    }

    setSendingInvite(true)
    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          to_name: inviteModal.user.name,
          to_email: inviteModal.user.email,
          app_url: APP_URL,
        },
        { publicKey }
      )

      showToast(`Invitación enviada a ${inviteModal.user.email}`, 'success')
      closeInviteModal()
    } catch (err) {
      console.error('Error sending invite:', err)
      showToast('Error al enviar la invitación', 'error')
    } finally {
      setSendingInvite(false)
    }
  }

  // Generate invite email text (plain text for clipboard)
  const getInviteEmailText = (familyUser: User) => {
    return `¡Hola ${familyUser.name}!

Has sido invitado/a a participar en el Christmas Planner de la familia.

En esta aplicación podrás:
- Crear tu carta de deseos navideños
- Ver las cartas de otros miembros de la familia
- Asignarte regalos para que nadie repita

Para acceder, simplemente entra en:
${APP_URL}

E inicia sesión con tu email: ${familyUser.email}

¡Felices fiestas! 🎄🎁`
  }

  // Generate invite email HTML preview component
  const InviteEmailPreview = ({ familyUser }: { familyUser: User }) => (
    <div className="bg-gray-100 p-4 rounded-lg">
      {/* Email client header simulation */}
      <div className="bg-white rounded-t-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 text-center text-xs text-gray-500">
          Vista previa del email
        </div>
      </div>

      {/* Email header */}
      <div className="bg-white border-x border-gray-200 px-4 py-3 space-y-1">
        <div className="flex items-center text-sm">
          <span className="text-gray-500 w-16">De:</span>
          <span className="text-gray-800">Christmas Planner &lt;noreply@christmas-planner.app&gt;</span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-gray-500 w-16">Para:</span>
          <span className="text-gray-800">{familyUser.name} &lt;{familyUser.email}&gt;</span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-gray-500 w-16">Asunto:</span>
          <span className="text-gray-800 font-medium">🎄 ¡Has sido invitado al Christmas Planner!</span>
        </div>
      </div>

      {/* Email body */}
      <div className="bg-white rounded-b-lg border border-t-0 border-gray-200 overflow-hidden">
        {/* Christmas header banner */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-8 text-center">
          <div className="text-5xl mb-2">🎄</div>
          <h1 className="text-2xl font-bold text-white">Christmas Planner</h1>
          <p className="text-red-100 text-sm mt-1">La app para organizar los regalos de la familia</p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-800 text-lg mb-4">
            ¡Hola <strong>{familyUser.name}</strong>! 👋
          </p>

          <p className="text-gray-600 mb-4">
            Has sido invitado/a a participar en el <strong>Christmas Planner</strong> de la familia.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium mb-2">Con esta aplicación podrás:</p>
            <ul className="text-green-700 space-y-1">
              <li className="flex items-center gap-2">
                <span>📝</span> Crear tu carta de deseos navideños
              </li>
              <li className="flex items-center gap-2">
                <span>👀</span> Ver las cartas de otros miembros de la familia
              </li>
              <li className="flex items-center gap-2">
                <span>🎁</span> Asignarte regalos para que nadie repita
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <div className="text-center mb-6">
            <div className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg">
              Acceder a Christmas Planner
            </div>
            <p className="text-xs text-gray-400 mt-2 break-all">{APP_URL}</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-gray-600 text-sm">
              <strong>📧 Tu email de acceso:</strong>
            </p>
            <p className="text-gray-800 font-mono bg-white px-3 py-2 rounded border mt-2">
              {familyUser.email}
            </p>
          </div>

          <p className="text-gray-500 text-sm text-center">
            Solo tienes que introducir tu email para entrar, ¡sin contraseña!
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 text-center">
          <p className="text-2xl mb-2">🎄🎁🎅</p>
          <p className="text-gray-600 font-medium">¡Felices Fiestas!</p>
          <p className="text-gray-400 text-xs mt-2">
            Este email fue enviado desde Christmas Planner
          </p>
        </div>
      </div>
    </div>
  )

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
                      {/* Invite button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openInviteModal(familyUser)}
                        disabled={actionLoading}
                        className="text-christmas-green hover:text-christmas-green-dark hover:bg-christmas-green/10"
                      >
                        📧 Invitar
                      </Button>

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

      {/* Invite email preview modal */}
      <Modal
        isOpen={inviteModal.isOpen}
        onClose={closeInviteModal}
        title="📧 Invitar a la familia"
        size="lg"
        preventClose={sendingInvite}
      >
        <div className="px-6 py-4">
          {inviteModal.user && (
            <>
              <p className="text-sm text-muted mb-4">
                Así se vería el email de invitación para <strong>{inviteModal.user.name}</strong>:
              </p>

              {/* HTML Email preview */}
              <div className="max-h-[60vh] overflow-y-auto">
                <InviteEmailPreview familyUser={inviteModal.user} />
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-between">
          <Button
            variant="outline"
            onClick={copyEmailToClipboard}
            disabled={sendingInvite}
          >
            📋 Copiar texto
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={closeInviteModal}
              disabled={sendingInvite}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSendInvite}
              disabled={sendingInvite}
            >
              {sendingInvite ? 'Enviando...' : '📧 Enviar email'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
