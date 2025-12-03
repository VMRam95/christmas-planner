'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
  preventClose?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  preventClose = false,
  size = 'md',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !preventClose) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, preventClose, onClose])

  // Focus trap and prevent scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      modalRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={preventClose ? undefined : onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          'relative bg-white rounded-xl shadow-2xl w-full mx-4 animate-scale-in',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-foreground"
          >
            {title}
          </h2>
          {!preventClose && (
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}
