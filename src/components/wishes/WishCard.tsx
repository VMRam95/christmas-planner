'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/types'

import type { Wish, WishWithAssignment } from '@/types'

type WishCardProps = {
  wish: Wish | WishWithAssignment
  // For owner view (my-wishes)
  onEdit?: (wish: Wish) => void
  onDelete?: (wish: Wish) => void
  // For family view
  onAssign?: (wish: WishWithAssignment) => void
  onUnassign?: (wish: WishWithAssignment) => void
  showAssignment?: boolean
  isOwner?: boolean
  isLoading?: boolean
}

export function WishCard({
  wish,
  onEdit,
  onDelete,
  onAssign,
  onUnassign,
  showAssignment = false,
  isOwner = false,
  isLoading = false,
}: WishCardProps) {
  const wishWithAssignment = wish as WishWithAssignment

  return (
    <div className="bg-white rounded-lg border border-border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-foreground truncate">{wish.title}</h3>
            <Badge className={PRIORITY_COLORS[wish.priority]}>
              {PRIORITY_LABELS[wish.priority]}
            </Badge>
            {/* Assignment badge (only for non-owners) */}
            {showAssignment && !isOwner && wishWithAssignment.is_assigned && (
              <Badge variant={wishWithAssignment.assigned_by_me ? 'success' : 'warning'}>
                {wishWithAssignment.assigned_by_me ? '🎁 Lo regalo yo' : '✓ Asignado'}
              </Badge>
            )}
          </div>

          {/* Description */}
          {wish.description && (
            <p className="mt-1 text-sm text-muted line-clamp-2">{wish.description}</p>
          )}

          {/* URL */}
          {wish.url && (
            <a
              href={wish.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm text-christmas-green hover:text-christmas-green-dark cursor-pointer"
            >
              🔗 Ver enlace
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Owner actions (edit/delete) */}
          {isOwner && onEdit && onDelete && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(wish)}
                disabled={isLoading}
                className="px-2"
              >
                ✏️
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(wish)}
                disabled={isLoading}
                className="px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                🗑️
              </Button>
            </>
          )}

          {/* Family actions (assign/unassign) */}
          {!isOwner && showAssignment && (
            <>
              {wishWithAssignment.assigned_by_me ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUnassign?.(wishWithAssignment)}
                  disabled={isLoading}
                >
                  Quitar
                </Button>
              ) : !wishWithAssignment.is_assigned ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onAssign?.(wishWithAssignment)}
                  disabled={isLoading}
                >
                  🎁 Me lo asigno
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
