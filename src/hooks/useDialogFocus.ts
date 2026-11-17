'use client'
import { useEffect, type RefObject } from 'react'

export function useDialogFocus(open: boolean, ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const element = ref.current
    const selector = 'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]'
    const targets = () => Array.from(element?.querySelectorAll<HTMLElement>(selector) || []).filter(e => e.getClientRects().length > 0)
    ;(targets()[0] || element)?.focus()
    function trap(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const items = targets(), first = items[0], last = items[items.length - 1]
      if (!first) { e.preventDefault(); element?.focus(); return }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === element)) { e.preventDefault(); last.focus() }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    element?.addEventListener('keydown', trap)
    return () => { document.body.style.overflow = previousOverflow; element?.removeEventListener('keydown', trap); previous?.focus() }
  }, [open, ref])
}
