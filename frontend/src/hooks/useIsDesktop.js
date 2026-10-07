import { useMediaQuery } from './useMediaQuery'

// Même seuil que le point de rupture lg de Tailwind (rail latéral visible).
const DESKTOP_QUERY = '(min-width: 1024px)'

export function useIsDesktop() {
  return useMediaQuery(DESKTOP_QUERY)
}
