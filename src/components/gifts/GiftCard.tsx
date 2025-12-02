'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/types'

import type { Wish, WishWithAssignment, SurpriseGift } from '@/types'

type GiftCardProps = {
  // The item to display (wish or surprise gift)
  gift: Wish | WishWithAssignment | SurpriseGift
  // Gift type
  type?: 'wish' | 'surprise'
  // Owner actions (edit/delete)
  onEdit?: (gift: Wish | SurpriseGift) => void
  onDelete?: (gift: Wish | SurpriseGift) => void
  // Assignment actions (for wishes only)
  onAssign?: (gift: WishWithAssignment) => void
  onUnassign?: (gift: WishWithAssignment) => void
  // Visibility flags
  showAssignment?: boolean
  showPriority?: boolean
  isOwner?: boolean
  isLoading?: boolean
  // Additional info
  ownerLabel?: string
}

export function GiftCard({
  gift,
  type = 'wish',
  onEdit,
  onDelete,
  onAssign,
  onUnassign,
  showAssignment = false,
  showPriority = true,
  isOwner = false,
  isLoading = false,
  ownerLabel,
}: GiftCardProps) {
  const wishGift = gift as WishWithAssignment
  const hasAssignment = 'is_assigned' in gift

  return (
    <div className="bg-white rounded-lg border border-border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-foreground truncate">{gift.title}</h3>

            {/* Priority badge (wishes only) */}
            {showPriority && 'priority' in gift && (
              <Badge className={PRIORITY_COLORS[gift.priority]}>
                {PRIORITY_LABELS[gift.priority]}
              </Badge>
            )}

            {/* Surprise badge */}
            {type === 'surprise' && (
              <Badge className="bg-christmas-gold/20 text-christmas-gold-dark">
                🎉 Sorpresa
              </Badge>
            )}

            {/* Assignment badge (only for non-owners viewing wishes) */}
            {showAssignment && !isOwner && hasAssignment && wishGift.is_assigned && (
              <Badge variant={wishGift.assigned_by_me ? 'success' : 'warning'}>
                {wishGift.assigned_by_me ? '🎁 Lo regalo yo' : '✓ Asignado'}
              </Badge>
            )}

            {/* Owner label (e.g., "(tuyo)" for surprise gifts) */}
            {ownerLabel && (
              <span className="text-xs text-muted">({ownerLabel})</span>
            )}
          </div>

          {/* Description */}
          {gift.description && (
            <p className="mt-1 text-sm text-muted line-clamp-2">{gift.description}</p>
          )}

          {/* URL */}
          {gift.url && (
            <a
              href={gift.url}
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
          {isOwner && (onEdit || onDelete) && (
            <>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(gift as Wish | SurpriseGift)}
                  disabled={isLoading}
                  className="px-2"
                >
                  ✏️
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(gift as Wish | SurpriseGift)}
                  disabled={isLoading}
                  className="px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  🗑️
                </Button>
              )}
            </>
          )}

          {/* Family actions (assign/unassign) - for wishes only */}
          {!isOwner && showAssignment && hasAssignment && (
            <>
              {wishGift.assigned_by_me ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUnassign?.(wishGift)}
                  disabled={isLoading}
                >
                  Quitar
                </Button>
              ) : !wishGift.is_assigned ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onAssign?.(wishGift)}
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
