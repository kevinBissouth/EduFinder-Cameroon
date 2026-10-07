import { useState } from 'react'

import { useMediaQuery } from './useMediaQuery'
import { paginate } from '../utils/pagination'

// Même seuil que le point de rupture sm de Tailwind : en dessous, les cartes
// sont sur une seule colonne et une page longue devient pénible à parcourir.
const WIDE_SCREEN_QUERY = '(min-width: 640px)'
const PAGE_SIZE_ON_WIDE_SCREEN = 6
const PAGE_SIZE_ON_PHONE = 3

// Pagination d'une liste de cartes, dont la taille de page dépend de l'écran.
export function usePagedItems(items) {
  const isWideScreen = useMediaQuery(WIDE_SCREEN_QUERY)
  const pageSize = isWideScreen ? PAGE_SIZE_ON_WIDE_SCREEN : PAGE_SIZE_ON_PHONE
  const [requestedPageIndex, setRequestedPageIndex] = useState(0)

  return { ...paginate(items, pageSize, requestedPageIndex), goToPage: setRequestedPageIndex }
}
