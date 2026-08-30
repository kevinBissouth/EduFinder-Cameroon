// Observateur d'apparition réutilisable : passe à true quand l'élément entre
// dans le viewport, avec un filet de sécurité temporel pour ne jamais laisser
// un contenu invisible si l'observateur échoue (ou après un hot-reload).
import { useEffect, useRef, useState } from 'react'

export function useInView(threshold = 0.25, fallbackDelay = 1600) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const fallback = setTimeout(() => setInView(true), fallbackDelay)
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      return () => clearTimeout(fallback)
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          clearTimeout(fallback)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(node)
    return () => {
      clearTimeout(fallback)
      observer.disconnect()
    }
  }, [threshold, fallbackDelay])

  return [ref, inView]
}
