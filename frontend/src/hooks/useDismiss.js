import { useEffect } from 'react'

// Referme un élément flottant (menu, panneau) au clic en dehors ou à la
// touche Échap, comme le font les menus du système.
export function useDismiss(containerRef, isOpen, onDismiss) {
  useEffect(() => {
    if (!isOpen) return undefined

    const dismissOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) onDismiss()
    }
    const dismissOnEscape = (event) => {
      if (event.key === 'Escape') onDismiss()
    }
    document.addEventListener('mousedown', dismissOnOutsideClick)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('mousedown', dismissOnOutsideClick)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [containerRef, isOpen, onDismiss])
}
