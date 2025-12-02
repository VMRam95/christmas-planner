'use client'

import { useState } from 'react'
import { getInitials, getAvatarColor, cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
}

export function Avatar({ name, avatarUrl, size = 'md', className }: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const showImage = avatarUrl && !imageError

  const initials = getInitials(name)
  const bgColor = getAvatarColor(name)

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center font-semibold text-white overflow-hidden',
        sizeClasses[size],
        !showImage && bgColor,
        className
      )}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
