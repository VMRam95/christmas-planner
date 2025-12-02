'use client'

import { useState } from 'react'
import { cn, getInitials, getAvatarColor } from '@/lib/utils'

import type { HTMLAttributes } from 'react'

type MemberAvatarProps = HTMLAttributes<HTMLDivElement> & {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const sizeStyles = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
}

export function MemberAvatar({
  className,
  name,
  avatarUrl,
  size = 'md',
  ...props
}: MemberAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const showImage = avatarUrl && !imageError

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-semibold shrink-0 overflow-hidden',
        !showImage && getAvatarColor(name),
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}
