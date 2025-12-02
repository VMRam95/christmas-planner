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

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)

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

        // Update with full assignment info
        const finalWishes = wishesWithAssignments.map((wish) => ({
          ...wish,
          is_assigned: allAssignmentsCheck.includes(wish.id),
        }))

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

  // Helper to check all assignments
  async function checkAllAssignments(wishIds: string[]): Promise<string[]> {
    try {
      const response = await fetch(`/api/wishes/assignments?wish_ids=${wishIds.join(',')}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.data.map((a: { wish_id: string }) => a.wish_id)
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
            w.id === wish.id ? { ...w, is_assigned: false, assigned_by_me: false } : w
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

  if (!isAuthenticated || !member) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <span className="text-6xl block mb-4">🤷</span>
          <h1 className="text-xl font-semibold mb-2">Usuario no encontrado</h1>
          <Link href="/dashboard">
            <Button>Volver al inicio</Button>
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <BackLink href="/dashboard" label="Volver al dashboard" className="mb-6" />

        {/* Member header */}
        <div className="flex items-center gap-4 mb-8">
          <MemberAvatar name={member.name} avatarUrl={member.avatar_url} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Carta de {member.name}
            </h1>
            <p className="text-muted">
              Mira lo que le gustaría recibir y asígnate un regalo
            </p>
          </div>
        </div>

        {/* Wishes list */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🎁</span>
              <span>Deseos de {member.name} ({wishes.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wishes.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-4xl block mb-2">📭</span>
                <p className="text-muted">{member.name} aún no ha añadido deseos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {wishes.map((wish) => (
                  <GiftCard
                    key={wish.id}
                    gift={wish}
                    type="wish"
                    showAssignment
                    onAssign={handleAssign}
                    onUnassign={handleUnassign}
                    isLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Surprise gifts from others */}
        {surpriseGifts.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎉</span>
                <span>Regalos sorpresa para {member.name} ({surpriseGifts.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted mb-4">
                Otros familiares ya han comprometido estos regalos. Evita comprar lo mismo.
              </p>
              <div className="space-y-3">
                {surpriseGifts.map((gift) => (
                  <GiftCard
                    key={gift.id}
                    gift={gift}
                    type="surprise"
                    showPriority={false}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create surprise gift action */}
        <div
          onClick={() => setShowCreateModal(true)}
          className="cursor-pointer"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowCreateModal(true)}
        >
          <SectionCard
            icon="🎁"
            title="Crear Regalo"
            description={`Crea un regalo sorpresa para ${member.name}`}
            action={
              <Button variant="primary" size="sm">
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
    </div>
  )
}
