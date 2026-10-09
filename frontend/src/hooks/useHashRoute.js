import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { parseCurrentRoute } from '../routes'

// Pages du site public, connexion comprise : ce sont les seules dont le
// passage de l'une à l'autre est animé. Les espaces privés restent sobres.
const PUBLIC_PAGES = ['home', 'school-detail', 'compare', 'saved', 'login']

function toPageKey(route) {
  return `${route.page}/${route.id ?? ''}`
}

// Route courante, lue dans le hash de l'adresse. Quand on change de page
// publique, le navigateur fait lui-même le fondu enchaîné (View Transitions) :
// il photographie l'ancienne page, React affiche la nouvelle d'un seul coup
// (flushSync), puis il fond l'une dans l'autre. Sans cette fonction, ou pour
// une simple ancre dans la même page, la route change sans effet.
export function useHashRoute() {
  const [route, setRoute] = useState(() => parseCurrentRoute())
  const shownPageKey = useRef(toPageKey(route))

  useEffect(() => {
    const onHashChange = () => {
      const nextRoute = parseCurrentRoute()
      const nextPageKey = toPageKey(nextRoute)
      const isNewPage = nextPageKey !== shownPageKey.current
      shownPageKey.current = nextPageKey

      const canAnimate =
        isNewPage && PUBLIC_PAGES.includes(nextRoute.page) && Boolean(document.startViewTransition)
      if (!canAnimate) {
        setRoute(nextRoute)
        return
      }
      document.startViewTransition(() => flushSync(() => setRoute(nextRoute)))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return { route, pageKey: toPageKey(route) }
}
