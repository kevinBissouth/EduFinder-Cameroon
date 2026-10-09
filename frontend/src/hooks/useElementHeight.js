import { useEffect, useState } from 'react'

// Hauteur réelle d'un élément, suivie quand elle change (texte qui passe à la
// ligne, écran qui tourne).
export function useElementHeight(elementRef) {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return undefined
    const resizeObserver = new ResizeObserver(() => setHeight(element.offsetHeight))
    resizeObserver.observe(element)
    return () => resizeObserver.disconnect()
  }, [elementRef])

  return height
}
