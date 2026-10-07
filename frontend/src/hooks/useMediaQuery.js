import { useEffect, useState } from 'react'

export function useMediaQuery(mediaQueryText) {
  const [matches, setMatches] = useState(() => window.matchMedia(mediaQueryText).matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia(mediaQueryText)
    const updateMatches = () => setMatches(mediaQuery.matches)
    updateMatches()
    mediaQuery.addEventListener('change', updateMatches)
    return () => mediaQuery.removeEventListener('change', updateMatches)
  }, [mediaQueryText])

  return matches
}
