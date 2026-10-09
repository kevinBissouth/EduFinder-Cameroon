import { useEffect, useRef, useState } from 'react'

// Un menu déroulant qui se referme comme ceux du système : par un clic en
// dehors ou par la touche Échap. menuRef se pose sur l'élément qui contient
// à la fois le bouton et la liste.
export function useDismissibleMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  return { isOpen, setIsOpen, menuRef }
}
