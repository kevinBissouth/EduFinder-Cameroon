import { useEffect, useState } from 'react'

// Dit si le contenu d'un élément dépasse sa hauteur visible, pour ne signaler
// le défilement que quand il y a réellement quelque chose à faire défiler.
export function useHasOverflow(elementRef) {
  const [hasOverflow, setHasOverflow] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return undefined

    const measure = () => setHasOverflow(element.scrollHeight > element.clientHeight + 1)
    measure()
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(element)
    ;[...element.children].forEach((child) => resizeObserver.observe(child))
    return () => resizeObserver.disconnect()
  })

  return hasOverflow
}
