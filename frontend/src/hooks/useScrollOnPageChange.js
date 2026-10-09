import { useEffect, useLayoutEffect, useRef } from 'react'

const TRAVERSE_NAVIGATION = 'traverse'
const LAYOUT_SETTLE_MILLISECONDS = 3000
const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown']

function findAnchoredSection(hash) {
  const sectionId = hash.replace(/^#/, '')
  return sectionId ? document.getElementById(sectionId) : null
}

// La page d'accueil se remplit après son premier affichage (chiffres,
// résultats) : la section visée glisse alors vers le bas. Je la remets en
// place tant que la mise en page bouge, et je m'arrête dès que le visiteur
// prend la main ou que le délai est passé.
function holdSectionInView(section) {
  const alignSection = () => section.scrollIntoView({ behavior: 'instant' })
  const layoutObserver = new ResizeObserver(alignSection)
  const release = () => {
    layoutObserver.disconnect()
    clearTimeout(releaseTimer)
    USER_SCROLL_EVENTS.forEach((eventName) => window.removeEventListener(eventName, release))
  }
  const releaseTimer = setTimeout(release, LAYOUT_SETTLE_MILLISECONDS)

  alignSection()
  layoutObserver.observe(document.body)
  USER_SCROLL_EVENTS.forEach((eventName) =>
    window.addEventListener(eventName, release, { passive: true }),
  )
}

// Le routage du site ne recharge rien : sans ce crochet, on arrive sur une
// nouvelle page à la hauteur où l'on a quitté la précédente. Je remonte donc
// en haut à chaque changement de page, ou je vais à la section visée quand
// l'adresse en nomme une (le navigateur l'a cherchée avant que la page existe).
// Avec Précédent / Suivant je ne touche à rien : le navigateur restaure
// lui-même la position.
export function useScrollOnPageChange(pageKey) {
  const lastNavigationType = useRef(null)
  const previousPageKey = useRef(pageKey)

  useEffect(() => {
    const browserNavigation = window.navigation
    if (!browserNavigation) return undefined
    const rememberNavigationType = (event) => {
      lastNavigationType.current = event.navigationType
    }
    browserNavigation.addEventListener('navigate', rememberNavigationType)
    return () => browserNavigation.removeEventListener('navigate', rememberNavigationType)
  }, [])

  // Avant la peinture, et non après : le fondu entre deux pages photographie
  // la nouvelle page dès qu'elle est affichée, elle doit déjà être en haut.
  useLayoutEffect(() => {
    if (previousPageKey.current === pageKey) return
    previousPageKey.current = pageKey
    if (lastNavigationType.current === TRAVERSE_NAVIGATION) return

    const anchoredSection = findAnchoredSection(window.location.hash)
    if (anchoredSection) {
      holdSectionInView(anchoredSection)
      return
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pageKey])
}
