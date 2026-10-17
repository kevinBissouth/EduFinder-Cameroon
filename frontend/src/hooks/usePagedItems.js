import { useState } from 'react'

import { useMediaQuery } from './useMediaQuery'
import { paginate } from '../utils/pagination'

// Même seuil que le point de rupture sm de Tailwind : en dessous, les cartes
// sont sur une seule colonne et une page longue devient pénible à parcourir.
const WIDE_SCREEN_QUERY = '(min-width: 640px)'
export const CARD_PAGE_SIZES = { onWideScreen: 6, onPhone: 3 }

// Pagination d'une liste de cartes, dont la taille de page dépend de l'écran.
// Des éléments plus compacts que des cartes (des lignes) en mettent plus par page.
export function usePagedItems(items, pageSizes = CARD_PAGE_SIZES) {
  const isWideScreen = useMediaQuery(WIDE_SCREEN_QUERY)
  const pageSize = isWideScreen ? pageSizes.onWideScreen : pageSizes.onPhone
  const [requestedPageIndex, setRequestedPageIndex] = useState(0)

  return { ...paginate(items, pageSize, requestedPageIndex), goToPage: setRequestedPageIndex }
}
