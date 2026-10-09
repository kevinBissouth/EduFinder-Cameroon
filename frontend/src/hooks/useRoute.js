import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { isSitePath, navigateTo, onNavigation, parseCurrentRoute, readLegacyHashPath } from '../routes'
import { scrollToPageTop } from '../utils/scroll'

// Pages du site public, connexion comprise : ce sont les seules dont le
// passage de l'une à l'autre est animé. Les espaces privés restent sobres.
const PUBLIC_PAGES = ['home', 'school-detail', 'compare', 'saved', 'login', 'legal-notice', 'privacy']
const PRIMARY_BUTTON = 0

function toPageKey(route) {
  return `${route.page}/${route.id ?? ''}`
}

// Un ancien lien en « #/… » est remplacé par son vrai chemin avant la
// première lecture de la route, sans laisser de trace dans l'historique.
function adoptLegacyAddress() {
  const legacyPath = readLegacyHashPath(window.location.hash)
  if (legacyPath) window.history.replaceState(null, '', legacyPath)
}

// L'adresse visée par un clic que le site doit traiter lui-même, sinon null.
// Je laisse au navigateur tout ce qui sort de l'ordinaire : nouvel onglet,
// téléchargement, autre site, fichier ou API du même domaine.
function findSiteDestination(event) {
  const hasModifier = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
  if (event.defaultPrevented || event.button !== PRIMARY_BUTTON || hasModifier) return null
  const link = event.target.closest?.('a[href]')
  if (!link || link.target || link.hasAttribute('download')) return null
  const destination = new URL(link.href)
  const isSiteLink = destination.origin === window.location.origin && isSitePath(destination.pathname)
  return isSiteLink ? destination : null
}

// Un lien du site ne recharge pas la page. Vers une section de la page en
// cours (« /#results »), le navigateur sait déjà défiler : je ne m'en mêle pas.
function followSiteLink(event) {
  const destination = findSiteDestination(event)
  if (!destination) return
  const isSamePage = destination.pathname === window.location.pathname
  if (isSamePage && destination.hash) return

  event.preventDefault()
  if (isSamePage) {
    scrollToPageTop()
    return
  }
  navigateTo(`${destination.pathname}${destination.search}${destination.hash}`)
}

// Route courante, lue dans le chemin de l'adresse. Quand on change de page
// publique, le navigateur fait lui-même le fondu enchaîné (View Transitions) :
// il photographie l'ancienne page, React affiche la nouvelle d'un seul coup
// (flushSync), puis il fond l'une dans l'autre. Sans cette fonction, ou si la
// page reste la même, la route change sans effet.
export function useRoute() {
  const [route, setRoute] = useState(() => {
    adoptLegacyAddress()
    return parseCurrentRoute()
  })
  const shownPageKey = useRef(toPageKey(route))

  useEffect(() => {
    const showCurrentRoute = () => {
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
    document.addEventListener('click', followSiteLink)
    const stopListening = onNavigation(showCurrentRoute)
    return () => {
      document.removeEventListener('click', followSiteLink)
      stopListening()
    }
  }, [])

  return { route, pageKey: toPageKey(route) }
}
