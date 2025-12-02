'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { useToast } from '@/components/ui/toast'
import { getInitials, getAvatarColor } from '@/lib/utils'

import type { User, AssignmentWithWish, SurpriseGiftWithRecipient, PRIORITY_LABELS } from '@/types'

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
  const [unassignModal, setUnassignModal] = useState<{ isOpen: boolean; wishId: string | null; wishTitle: string }>({
    isOpen: false,
    wishId: null,
    wishTitle: '',
  })

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            ¡Hola, {user?.name}! 👋
          </h1>
          <p className="text-muted mt-1">
            Bienvenido al organizador de regalos navideños
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl">📝</span>
                <div className="flex-1">
                  <h3 className="font-semibold">Mi Carta a los Reyes</h3>
                  <p className="text-sm text-muted">
                    Añade lo que te gustaría recibir
                  </p>
                </div>
                <Link href="/my-wishes">
                  <Button variant="secondary" size="sm">
                    Ver mi carta
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* My assigned gifts section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🎁</span>
              <span>Mis regalos asignados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAssignments ? (
              <div className="py-8 text-center text-muted">
                Cargando regalos asignados...
              </div>
            ) : assignments.length === 0 && surpriseGifts.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-4xl block mb-2">🎄</span>
                <p className="text-muted">
                  Aún no tienes regalos asignados. Visita las listas de deseos de tu familia
                  para asignarte regalos.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Assigned wishes */}
                {assignments.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3 text-sm text-muted">
                      Deseos asignados ({assignments.length})
                    </h3>
                    <div className="space-y-3">
                      {assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-christmas-green/50 hover:bg-christmas-green/5 transition-colors"
                        >
                          <span className="text-2xl">📝</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              <h4 className="font-medium text-foreground">
                                {assignment.christmas_wishes.title}
                              </h4>
                              <Badge variant={priorityColors[assignment.christmas_wishes.priority]}>
                                {priorityLabels[assignment.christmas_wishes.priority]}
                              </Badge>
                            </div>
                            {assignment.christmas_wishes.description && (
                              <p className="text-sm text-muted mb-2 line-clamp-2">
                                {assignment.christmas_wishes.description}
                              </p>
                            )}
                            <p className="text-sm text-muted">
                              Para: <span className="font-medium text-foreground">
                                {getRecipientName(assignment.christmas_wishes.user_id)}
                              </span>
                            </p>
                            {assignment.christmas_wishes.url && (
                              <a
                                href={assignment.christmas_wishes.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-christmas-green hover:text-christmas-green-dark mt-1 inline-flex items-center gap-1"
                              >
                                Ver enlace ↗
                              </a>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUnassignModal(assignment.wish_id, assignment.christmas_wishes.title)}
                            disabled={unassigningWishId === assignment.wish_id}
                          >
                            {unassigningWishId === assignment.wish_id
                              ? 'Quitando...'
                              : 'Quitar'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Surprise gifts */}
                {surpriseGifts.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3 text-sm text-muted">
                      Regalos sorpresa ({surpriseGifts.length})
                    </h3>
                    <div className="space-y-3">
                      {surpriseGifts.map((gift) => (
                        <div
                          key={gift.id}
                          className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-christmas-gold/50 hover:bg-christmas-gold/5 transition-colors"
                        >
                          <span className="text-2xl">🎉</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground mb-2">
                              {gift.description}
                            </p>
                            <p className="text-sm text-muted">
                              Para: <span className="font-medium text-foreground">
                                {gift.recipient.name}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Family members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>👨‍👩‍👧‍👦</span>
              <span>Familia</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMembers ? (
              <div className="py-8 text-center text-muted">
                Cargando miembros de la familia...
              </div>
            ) : otherMembers.length === 0 ? (
              <div className="py-8 text-center text-muted">
                No hay otros miembros de la familia registrados
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherMembers.map((member) => (
                  <Link
                    key={member.id}
                    href={`/family/${member.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-christmas-green hover:bg-christmas-green/5 transition-colors">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(member.name)}`}
                      >
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted">Ver lista de deseos</p>
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
    </div>
  )
}
