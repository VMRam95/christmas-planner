'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { WishCard } from '@/components/wishes/WishCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getInitials, getAvatarColor } from '@/lib/utils'

import type { User, WishWithAssignment, SurpriseGift } from '@/types'

export default function FamilyMemberPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  const { user: currentUser, isLoading: authLoading, isAuthenticated } = useAuth()

  const [member, setMember] = useState<User | null>(null)
  const [wishes, setWishes] = useState<WishWithAssignment[]>([])
  const [surpriseGifts, setSurpriseGifts] = useState<SurpriseGift[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Surprise gift form
  const [showSurpriseForm, setShowSurpriseForm] = useState(false)
  const [surpriseDescription, setSurpriseDescription] = useState('')

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
          // Check if this wish is assigned by anyone (we need another query for this)
          // For now, we'll check our own assignments
          const myAssignment = assignmentsData.success
            ? assignmentsData.data.find((a: { wish_id: string }) => a.wish_id === wish.id)
            : null

          return {
            ...wish,
            is_assigned: !!myAssignment, // This will be updated with full assignment check
            assigned_by_me: !!myAssignment,
          }
        })

        // We need to check all assignments for these wishes
        // Let's fetch all assignments for these wish IDs
        const wishIds = wishesData.data.map((w: { id: string }) => w.id)
        const allAssignmentsCheck = await checkAllAssignments(wishIds)

        // Update with full assignment info
        const finalWishes = wishesWithAssignments.map((wish) => ({
          ...wish,
          is_assigned: allAssignmentsCheck.includes(wish.id),
        }))

        setWishes(finalWishes)
      }

      // Fetch surprise gifts for this recipient
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
    // This is a workaround - ideally we'd have a dedicated endpoint
    // For now, we make individual checks via the wishes endpoint with assignments
    try {
      const response = await fetch(`/api/wishes/assignments?wish_ids=${wishIds.join(',')}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.data.map((a: { wish_id: string }) => a.wish_id)
        }
      }
    } catch {
      // Fallback - return empty (no extra assignment info)
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
      } else {
        alert(result.error || 'Error al asignar regalo')
      }
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
      }
    } finally {
      setActionLoading(false)
    }
  }

  // Create surprise gift
  const handleCreateSurprise = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!surpriseDescription.trim()) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/surprise-gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: userId,
          description: surpriseDescription,
        }),
      })
      const result = await response.json()
      if (result.success) {
        setSurpriseGifts((prev) => [result.data, ...prev])
        setSurpriseDescription('')
        setShowSurpriseForm(false)
      }
    } finally {
      setActionLoading(false)
    }
  }

  // Delete surprise gift
  const handleDeleteSurprise = async (gift: SurpriseGift) => {
    if (!confirm('¿Eliminar este regalo sorpresa?')) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/surprise-gifts?id=${gift.id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        setSurpriseGifts((prev) => prev.filter((g) => g.id !== gift.id))
      }
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
        {/* Member header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold ${getAvatarColor(member.name)}`}
          >
            {getInitials(member.name)}
          </div>
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
                  <WishCard
                    key={wish.id}
                    wish={wish}
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

        {/* Surprise gifts section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>🎉</span>
                <span>Regalos sorpresa</span>
              </span>
              {!showSurpriseForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSurpriseForm(true)}
                >
                  + Añadir
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Surprise form */}
            {showSurpriseForm && (
              <form onSubmit={handleCreateSurprise} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted mb-3">
                  ¿Vas a regalar algo que {member.name} no ha pedido? Anótalo aquí para que otros no lo repitan.
                </p>
                <Input
                  placeholder="Descripción del regalo sorpresa"
                  value={surpriseDescription}
                  onChange={(e) => setSurpriseDescription(e.target.value)}
                  className="mb-3"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" isLoading={actionLoading}>
                    Añadir
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowSurpriseForm(false)
                      setSurpriseDescription('')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            {/* Surprise gifts list */}
            {surpriseGifts.length === 0 && !showSurpriseForm ? (
              <p className="text-sm text-muted text-center py-4">
                No hay regalos sorpresa registrados para {member.name}
              </p>
            ) : (
              <div className="space-y-2">
                {surpriseGifts.map((gift) => (
                  <div
                    key={gift.id}
                    className="flex items-center justify-between p-3 bg-christmas-gold/10 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span>🎁</span>
                      <span className="text-sm">{gift.description}</span>
                      {gift.giver_id === currentUser?.id && (
                        <span className="text-xs text-muted">(tuyo)</span>
                      )}
                    </div>
                    {gift.giver_id === currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSurprise(gift)}
                        disabled={actionLoading}
                        className="px-2 text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link href="/dashboard" className="text-sm text-muted hover:text-christmas-green">
            ← Volver a la familia
          </Link>
        </div>
      </main>
    </div>
  )
}
