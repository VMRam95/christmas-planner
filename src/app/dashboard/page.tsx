'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionCard } from '@/components/ui/section-card'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { CreateGiftModal } from '@/components/ui/create-gift-modal'
import { useToast } from '@/components/ui/toast'

import type { User, AssignmentWithWish, SurpriseGiftWithRecipient } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const [familyMembers, setFamilyMembers] = useState<User[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [assignments, setAssignments] = useState<AssignmentWithWish[]>([])
  const [surpriseGifts, setSurpriseGifts] = useState<SurpriseGiftWithRecipient[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(true)
  const [unassigningWishId, setUnassigningWishId] = useState<string | null>(null)
  const [showAllAssignments, setShowAllAssignments] = useState(false)
  const [showAllSurprises, setShowAllSurprises] = useState(false)
  const [unassignModal, setUnassignModal] = useState<{ isOpen: boolean; wishId: string | null; wishTitle: string }>({
    isOpen: false,
    wishId: null,
    wishTitle: '',
  })
  const [createGiftModal, setCreateGiftModal] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, router])

  // Fetch family members
  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch('/api/users')
        const data = await response.json()
        if (data.success) {
          setFamilyMembers(data.data)
        }
      } catch (error) {
        console.error('Error fetching family members:', error)
      } finally {
        setLoadingMembers(false)
      }
    }

    if (isAuthenticated) {
      fetchMembers()
    }
  }, [isAuthenticated])

  // Fetch assignments and surprise gifts
  useEffect(() => {
    async function fetchAssignedGifts() {
      try {
        const [assignmentsRes, surpriseGiftsRes] = await Promise.all([
          fetch('/api/assignments'),
          fetch('/api/surprise-gifts'),
        ])

        const assignmentsData = await assignmentsRes.json()
        const surpriseGiftsData = await surpriseGiftsRes.json()

        if (assignmentsData.success) {
          setAssignments(assignmentsData.data)
        }

        if (surpriseGiftsData.success) {
          setSurpriseGifts(surpriseGiftsData.data)
        }
      } catch (error) {
        console.error('Error fetching assigned gifts:', error)
      } finally {
        setLoadingAssignments(false)
      }
    }

    if (isAuthenticated) {
      fetchAssignedGifts()
    }
  }, [isAuthenticated])

  // Open unassign modal
  const openUnassignModal = (wishId: string, wishTitle: string) => {
    setUnassignModal({ isOpen: true, wishId, wishTitle })
  }

  // Close unassign modal
  const closeUnassignModal = () => {
    setUnassignModal({ isOpen: false, wishId: null, wishTitle: '' })
  }

  // Handle unassign (called after modal confirmation)
  const handleUnassign = async () => {
    if (!unassignModal.wishId) return

    const wishId = unassignModal.wishId

    setUnassigningWishId(wishId)
    try {
      const response = await fetch(`/api/assignments?wish_id=${wishId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setAssignments(assignments.filter((a) => a.wish_id !== wishId))
        showToast('Regalo desasignado correctamente', 'success')
        closeUnassignModal()
      } else {
        showToast(data.error || 'Error al quitar la asignación', 'error')
      }
    } catch (error) {
      console.error('Error unassigning gift:', error)
      showToast('Error al quitar la asignación', 'error')
    } finally {
      setUnassigningWishId(null)
    }
  }

  // Get recipient name for an assignment
  const getRecipientName = (userId: string) => {
    const recipient = familyMembers.find((m) => m.id === userId)
    return recipient?.name || 'Desconocido'
  }

  // Handle gift creation success
  const handleGiftCreated = async () => {
    showToast('Regalo creado correctamente', 'success')
    // Refetch surprise gifts
    try {
      const response = await fetch('/api/surprise-gifts')
      const data = await response.json()
      if (data.success) {
        setSurpriseGifts(data.data)
      }
    } catch (error) {
      console.error('Error refetching surprise gifts:', error)
    }
  }

  // Priority labels
  const priorityLabels: Record<1 | 2 | 3, string> = {
    1: 'Baja',
    2: 'Media',
    3: 'Alta',
  }

  const priorityColors: Record<1 | 2 | 3, 'default' | 'warning' | 'error'> = {
    1: 'default',
    2: 'warning',
    3: 'error',
  }

  if (isLoading) {
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

  const otherMembers = familyMembers.filter((member) => member.id !== user?.id)

  // Show max 3 items initially, can expand to see more
  const visibleAssignments = showAllAssignments ? assignments : assignments.slice(0, 3)
  const visibleSurprises = showAllSurprises ? surpriseGifts : surpriseGifts.slice(0, 3)
  const hasMoreAssignments = assignments.length > 3
  const hasMoreSurprises = surpriseGifts.length > 3

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Welcome section - More compact */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            ¡Hola, {user?.name}! 👋
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Bienvenido al organizador de regalos navideños
          </p>
        </div>

        {/* Quick actions - More compact with SectionCard */}
        <div className="mb-6 grid sm:grid-cols-2 gap-4">
          <Link href="/my-wishes">
            <SectionCard
              icon="📝"
              title="Mi Carta a los Reyes"
              description="Añade lo que te gustaría recibir"
              action={
                <Button variant="secondary" size="sm">
                  Ver carta
                </Button>
              }
            />
          </Link>
          <div
            onClick={() => setCreateGiftModal(true)}
            className="text-left cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setCreateGiftModal(true)}
          >
            <SectionCard
              icon="🎁"
              title="Crear Regalo"
              description="Crea un regalo para alguien especial"
              action={
                <Button variant="primary" size="sm">
                  Crear
                </Button>
              }
            />
          </div>
        </div>

        {/* My assigned gifts section - More compact with collapsible lists */}
        <Card className="mb-6">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span>🎁</span>
              <span>Mis regalos asignados</span>
              {(assignments.length > 0 || surpriseGifts.length > 0) && (
                <Badge variant="success" className="ml-auto">
                  {assignments.length + surpriseGifts.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            {loadingAssignments ? (
              <EmptyState icon="⏳" message="Cargando regalos asignados..." />
            ) : assignments.length === 0 && surpriseGifts.length === 0 ? (
              <EmptyState
                icon="🎄"
                message="Aún no tienes regalos asignados. Visita las listas de deseos de tu familia para asignarte regalos."
              />
            ) : (
              <div className="space-y-4">
                {/* Assigned wishes */}
                {assignments.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2 text-xs text-muted uppercase tracking-wide">
                      Deseos asignados ({assignments.length})
                    </h3>
                    <div className="space-y-2">
                      {visibleAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-christmas-green/50 hover:bg-christmas-green/5 transition-colors"
                        >
                          <span className="text-xl shrink-0">📝</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              <h4 className="font-medium text-sm text-foreground">
                                {assignment.wishes.title}
                              </h4>
                              <Badge variant={priorityColors[assignment.wishes.priority]} className="shrink-0">
                                {priorityLabels[assignment.wishes.priority]}
                              </Badge>
                            </div>
                            {assignment.wishes.description && (
                              <p className="text-xs text-muted mb-1.5 line-clamp-2">
                                {assignment.wishes.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="text-xs text-muted">
                                Para: <span className="font-medium text-foreground">
                                  {getRecipientName(assignment.wishes.user_id)}
                                </span>
                              </p>
                              {assignment.wishes.url && (
                                <a
                                  href={assignment.wishes.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-christmas-green hover:text-christmas-green-dark inline-flex items-center gap-1"
                                >
                                  Ver enlace ↗
                                </a>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUnassignModal(assignment.wish_id, assignment.wishes.title)}
                            disabled={unassigningWishId === assignment.wish_id}
                            className="shrink-0"
                          >
                            {unassigningWishId === assignment.wish_id
                              ? 'Quitando...'
                              : 'Quitar'}
                          </Button>
                        </div>
                      ))}
                    </div>
                    {hasMoreAssignments && (
                      <button
                        onClick={() => setShowAllAssignments(!showAllAssignments)}
                        className="text-xs text-christmas-green hover:text-christmas-green-dark font-medium mt-2 w-full text-center py-2 hover:bg-christmas-green/5 rounded transition-colors"
                      >
                        {showAllAssignments
                          ? 'Ver menos'
                          : `Ver ${assignments.length - 3} más`}
                      </button>
                    )}
                  </div>
                )}

                {/* Surprise gifts */}
                {surpriseGifts.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2 text-xs text-muted uppercase tracking-wide">
                      Regalos sorpresa ({surpriseGifts.length})
                    </h3>
                    <div className="space-y-2">
                      {visibleSurprises.map((gift) => (
                        <div
                          key={gift.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-christmas-gold/50 hover:bg-christmas-gold/5 transition-colors"
                        >
                          <span className="text-xl shrink-0">🎉</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-foreground mb-1">
                              {gift.title}
                            </h4>
                            {gift.description && (
                              <p className="text-xs text-muted mb-1.5 line-clamp-2">
                                {gift.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="text-xs text-muted">
                                Para: <span className="font-medium text-foreground">
                                  {gift.recipient.name}
                                </span>
                              </p>
                              {gift.url && (
                                <a
                                  href={gift.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-christmas-green hover:text-christmas-green-dark inline-flex items-center gap-1"
                                >
                                  Ver enlace ↗
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {hasMoreSurprises && (
                      <button
                        onClick={() => setShowAllSurprises(!showAllSurprises)}
                        className="text-xs text-christmas-green hover:text-christmas-green-dark font-medium mt-2 w-full text-center py-2 hover:bg-christmas-green/5 rounded transition-colors"
                      >
                        {showAllSurprises
                          ? 'Ver menos'
                          : `Ver ${surpriseGifts.length - 3} más`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Family members - Horizontal scroll on mobile, grid on desktop */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span>👨‍👩‍👧‍👦</span>
              <span>Familia</span>
              {otherMembers.length > 0 && (
                <Badge variant="info" className="ml-auto">
                  {otherMembers.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            {loadingMembers ? (
              <EmptyState icon="⏳" message="Cargando miembros de la familia..." />
            ) : otherMembers.length === 0 ? (
              <EmptyState
                icon="👥"
                message="No hay otros miembros de la familia registrados"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {otherMembers.map((member) => (
                  <Link
                    key={member.id}
                    href={`/family/${member.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-christmas-green hover:bg-christmas-green/5 transition-colors">
                      <MemberAvatar name={member.name} avatarUrl={member.avatar_url} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{member.name}</p>
                        <p className="text-xs text-muted">Ver lista de deseos</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Unassign confirmation modal */}
      <ConfirmModal
        isOpen={unassignModal.isOpen}
        onClose={closeUnassignModal}
        onConfirm={handleUnassign}
        title="Quitar asignación"
        message={`¿Estás seguro de que quieres dejar de asignarte "${unassignModal.wishTitle}"?`}
        confirmText="Quitar"
        cancelText="Cancelar"
        variant="danger"
        loading={unassigningWishId !== null}
      />

      {/* Create gift modal */}
      <CreateGiftModal
        isOpen={createGiftModal}
        onClose={() => setCreateGiftModal(false)}
        onSuccess={handleGiftCreated}
        familyMembers={familyMembers}
        currentUserId={user?.id || ''}
      />
    </div>
  )
}
