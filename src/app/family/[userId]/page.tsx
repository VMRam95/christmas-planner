'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { GiftCard } from '@/components/gifts/GiftCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { BackLink } from '@/components/ui/back-link'
import { SectionCard } from '@/components/ui/section-card'
import { CreateSurpriseGiftModal } from '@/components/ui/create-surprise-gift-modal'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { useToast } from '@/components/ui/toast'

import type { User, WishWithAssignment, SurpriseGift } from '@/types'

export default function FamilyMemberPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  const { user: currentUser, isLoading: authLoading, isAuthenticated } = useAuth()
  const { showToast } = useToast()

  const [member, setMember] = useState<User | null>(null)
  const [wishes, setWishes] = useState<WishWithAssignment[]>([])
  const [surpriseGifts, setSurpriseGifts] = useState<SurpriseGift[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Filter states
  const [showAssigned, setShowAssigned] = useState(false)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteSurpriseModal, setDeleteSurpriseModal] = useState<{
    isOpen: boolean
    gift: SurpriseGift | null
  }>({ isOpen: false, gift: null })
  const [deletingSurpriseId, setDeletingSurpriseId] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  // Redirect if trying to view own page
  useEffect(() => {
    if (currentUser && userId === currentUser.id) {
      router.push('/my-wishes')
    }
  }, [currentUser, userId, router])

  // Fetch member data and wishes
  const fetchData = useCallback(async () => {
    if (!currentUser) return

    try {
      // Fetch all users to get member info
      const usersResponse = await fetch('/api/users')
      const usersData = await usersResponse.json()
      if (usersData.success) {
        const foundMember = usersData.data.find((u: User) => u.id === userId)
        setMember(foundMember || null)
      }

      // Fetch wishes for this user
      const wishesResponse = await fetch(`/api/wishes?user_id=${userId}`)
      const wishesData = await wishesResponse.json()

      if (wishesData.success) {
        // Now fetch assignments to know which are assigned
        const assignmentsResponse = await fetch('/api/assignments')
        const assignmentsData = await assignmentsResponse.json()

        // Combine wishes with assignment info
        const wishesWithAssignments: WishWithAssignment[] = wishesData.data.map((wish: WishWithAssignment) => {
          const myAssignment = assignmentsData.success
            ? assignmentsData.data.find((a: { wish_id: string }) => a.wish_id === wish.id)
            : null

          return {
            ...wish,
            is_assigned: !!myAssignment,
            assigned_by_me: !!myAssignment,
          }
        })

        // Check all assignments for these wishes
        const wishIds = wishesData.data.map((w: { id: string }) => w.id)
        const allAssignmentsCheck = await checkAllAssignments(wishIds)

        // Update with full assignment info (including external assignment detection)
        const finalWishes = wishesWithAssignments.map((wish) => {
          const assignmentInfo = allAssignmentsCheck.find((a) => a.wish_id === wish.id)
          return {
            ...wish,
            is_assigned: !!assignmentInfo,
            is_external_assignment: assignmentInfo ? assignmentInfo.assigned_by === null : false,
          }
        })

        setWishes(finalWishes)
      }

      // Fetch surprise gifts for this recipient (from other givers)
      const surpriseResponse = await fetch(`/api/surprise-gifts?recipient_id=${userId}`)
      const surpriseData = await surpriseResponse.json()
      if (surpriseData.success) {
        setSurpriseGifts(surpriseData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, currentUser])

  // Helper to check all assignments and detect external ones
  async function checkAllAssignments(wishIds: string[]): Promise<{ wish_id: string; assigned_by: string | null }[]> {
    try {
      const response = await fetch(`/api/wishes/assignments?wish_ids=${wishIds.join(',')}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.data
        }
      }
    } catch {
      // Fallback - return empty
    }
    return []
  }

  useEffect(() => {
    if (isAuthenticated && currentUser && userId !== currentUser.id) {
      fetchData()
    }
  }, [isAuthenticated, currentUser, userId, fetchData])

  // Assign wish
  const handleAssign = async (wish: WishWithAssignment) => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wish_id: wish.id }),
      })
      const result = await response.json()
      if (result.success) {
        setWishes((prev) =>
          prev.map((w) =>
            w.id === wish.id ? { ...w, is_assigned: true, assigned_by_me: true } : w
          )
        )
        showToast('Regalo asignado correctamente', 'success')
      } else {
        showToast(result.error || 'Error al asignar regalo', 'error')
      }
    } catch {
      showToast('Error al asignar regalo', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Unassign wish
  const handleUnassign = async (wish: WishWithAssignment) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/assignments?wish_id=${wish.id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        setWishes((prev) =>
          prev.map((w) =>
            w.id === wish.id ? { ...w, is_assigned: false, assigned_by_me: false, is_external_assignment: false } : w
          )
        )
        showToast('Asignación eliminada', 'success')
      } else {
        showToast(result.error || 'Error al quitar asignación', 'error')
      }
    } catch {
      showToast('Error al quitar asignación', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Assign wish to external person (someone not in the app)
  const handleAssignExternal = async (wish: WishWithAssignment) => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wish_id: wish.id, external: true }),
      })
      const result = await response.json()
      if (result.success) {
        setWishes((prev) =>
          prev.map((w) =>
            w.id === wish.id ? { ...w, is_assigned: true, assigned_by_me: false, is_external_assignment: true } : w
          )
        )
        showToast('Regalo asignado a otra persona', 'success')
      } else {
        showToast(result.error || 'Error al asignar regalo', 'error')
      }
    } catch {
      showToast('Error al asignar regalo', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle gift creation success
  const handleGiftCreated = async () => {
    showToast('Regalo sorpresa creado correctamente', 'success')
    // Refresh surprise gifts list
    try {
      const surpriseResponse = await fetch(`/api/surprise-gifts?recipient_id=${userId}`)
      const surpriseData = await surpriseResponse.json()
      if (surpriseData.success) {
        setSurpriseGifts(surpriseData.data)
      }
    } catch {
      // Ignore refresh errors
    }
  }

  // Handle surprise gift delete
  const openDeleteSurpriseModal = (gift: SurpriseGift) => {
    setDeleteSurpriseModal({ isOpen: true, gift })
  }

  const closeDeleteSurpriseModal = () => {
    setDeleteSurpriseModal({ isOpen: false, gift: null })
  }

  const handleDeleteSurprise = async () => {
    if (!deleteSurpriseModal.gift) return

    setDeletingSurpriseId(deleteSurpriseModal.gift.id)
    try {
      const response = await fetch(`/api/surprise-gifts?id=${deleteSurpriseModal.gift.id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        setSurpriseGifts((prev) => prev.filter((g) => g.id !== deleteSurpriseModal.gift!.id))
        showToast('Regalo sorpresa eliminado', 'success')
        closeDeleteSurpriseModal()
      } else {
        showToast(result.error || 'Error al eliminar regalo sorpresa', 'error')
      }
    } catch {
      showToast('Error al eliminar regalo sorpresa', 'error')
    } finally {
      setDeletingSurpriseId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-3xl sm:text-4xl animate-bounce block">🎄</span>
          <p className="mt-2 text-sm sm:text-base text-muted">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !member) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-center">
          <span className="text-5xl sm:text-6xl block mb-3 sm:mb-4">🤷</span>
          <h1 className="text-lg sm:text-xl font-semibold mb-2">Usuario no encontrado</h1>
          <Link href="/dashboard">
            <Button className="min-h-[44px] px-6">Volver al inicio</Button>
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <BackLink href="/dashboard" label="Volver al dashboard" className="mb-4 sm:mb-6" />

        {/* Member header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <MemberAvatar name={member.name} avatarUrl={member.avatar_url} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground break-words">
              Carta de {member.name}
            </h1>
            <p className="text-sm sm:text-base text-muted mt-1">
              Mira lo que le gustaría recibir y asígnate un regalo
            </p>
          </div>
        </div>

        {/* Wishes list */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span className="text-xl sm:text-2xl">🎁</span>
                <span className="break-words">Deseos de {member.name} ({wishes.filter(w => !w.is_assigned || w.assigned_by_me).length})</span>
              </CardTitle>
              {wishes.some(w => w.is_assigned && !w.assigned_by_me) && (
                <label className="flex items-center gap-2 text-sm text-muted cursor-pointer select-none min-h-[44px] sm:min-h-0">
                  <input
                    type="checkbox"
                    checked={showAssigned}
                    onChange={(e) => setShowAssigned(e.target.checked)}
                    className="w-5 h-5 sm:w-4 sm:h-4 rounded border-border text-christmas-green focus:ring-christmas-green cursor-pointer flex-shrink-0"
                  />
                  <span className="whitespace-nowrap">
                    Mostrar asignados ({wishes.filter(w => w.is_assigned && !w.assigned_by_me).length})
                  </span>
                </label>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {wishes.length === 0 ? (
              <div className="py-6 sm:py-8 text-center">
                <span className="text-3xl sm:text-4xl block mb-2">📭</span>
                <p className="text-sm sm:text-base text-muted">{member.name} aún no ha añadido deseos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {wishes
                  .filter((wish) => {
                    // Always show wishes assigned by me
                    if (wish.assigned_by_me) return true
                    // Show unassigned wishes
                    if (!wish.is_assigned) return true
                    // Show assigned wishes only if checkbox is checked
                    return showAssigned
                  })
                  .map((wish) => {
                    // Disabled only if assigned by another app user (not by me, not external)
                    const isAssignedByOtherUser = wish.is_assigned && !wish.assigned_by_me && !wish.is_external_assignment
                    return (
                      <GiftCard
                        key={wish.id}
                        gift={wish}
                        type="wish"
                        showAssignment
                        onAssign={handleAssign}
                        onAssignExternal={handleAssignExternal}
                        onUnassign={handleUnassign}
                        isLoading={actionLoading}
                        disabled={isAssignedByOtherUser}
                      />
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Surprise gifts from others */}
        {surpriseGifts.length > 0 && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span className="text-xl sm:text-2xl">🎉</span>
                <span className="break-words">Regalos sorpresa para {member.name} ({surpriseGifts.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-muted mb-3 sm:mb-4">
                Otros familiares ya han comprometido estos regalos. Evita comprar lo mismo.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {surpriseGifts.map((gift) => {
                  const isMyGift = currentUser ? gift.giver_id === currentUser.id : false
                  return (
                    <GiftCard
                      key={gift.id}
                      gift={gift}
                      type="surprise"
                      showPriority={false}
                      isOwner={isMyGift}
                      onDelete={isMyGift ? () => openDeleteSurpriseModal(gift) : undefined}
                      isLoading={deletingSurpriseId === gift.id}
                      ownerLabel={isMyGift ? 'tuyo' : undefined}
                    />
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create surprise gift action */}
        <div
          onClick={() => setShowCreateModal(true)}
          className="cursor-pointer touch-manipulation"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowCreateModal(true)}
        >
          <SectionCard
            icon="🎁"
            title="Crear Regalo"
            description={`Crea un regalo sorpresa para ${member.name}`}
            action={
              <Button variant="primary" size="sm" className="min-h-[44px] px-4">
                Crear
              </Button>
            }
          />
        </div>
      </main>

      {/* Create surprise gift modal */}
      <CreateSurpriseGiftModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleGiftCreated}
        recipientId={userId}
        recipientName={member.name}
      />

      {/* Delete surprise gift confirmation modal */}
      <ConfirmModal
        isOpen={deleteSurpriseModal.isOpen}
        onClose={closeDeleteSurpriseModal}
        onConfirm={handleDeleteSurprise}
        title="Eliminar regalo sorpresa"
        message={`¿Seguro que quieres eliminar "${deleteSurpriseModal.gift?.title}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={!!deletingSurpriseId}
      />
    </div>
  )
}
