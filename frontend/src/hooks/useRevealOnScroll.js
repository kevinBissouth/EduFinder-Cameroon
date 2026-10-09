import { useEffect } from 'react'

// Les blocs à faire apparaître : le contenu de chaque section de la page, et
// tout élément qui le demande avec l'attribut data-reveal.
const REVEAL_TARGETS = ':scope > section > *, [data-reveal]'
const PENDING = 'pending'
const SHOWN = 'shown'
// Un bloc se révèle quand il a dépassé le bas de l'écran de cette marge : on
// le voit ainsi monter, au lieu qu'il soit déjà en place en arrivant.
const REVEAL_MARGIN = '0px 0px -12% 0px'

// Apparition au défilement. Chaque bloc attend caché, puis joue son entrée
// (définie en CSS) une seule fois, quand il arrive à l'écran. C'est ce crochet
// qui cache les blocs : sans JavaScript, ou si le navigateur ne connaît pas
// IntersectionObserver, tout reste simplement visible. Les sections ajoutées
// plus tard (une fiche qui finit de charger) sont prises en compte.
export function useRevealOnScroll(pageRef) {
  useEffect(() => {
    const page = pageRef.current
    if (!page || !('IntersectionObserver' in window)) return undefined

    const revealer = new IntersectionObserver(
      (entries) =>
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry) => {
            entry.target.dataset.reveal = SHOWN
            revealer.unobserve(entry.target)
          }),
      { rootMargin: REVEAL_MARGIN },
    )
    // Je retiens moi-même les blocs déjà suivis plutôt que de me fier à leur
    // attribut : si le crochet redémarre, un bloc resté « pending » doit être
    // repris, sinon il resterait caché pour de bon.
    const watchedBlocks = new WeakSet()
    const watchNewBlocks = () =>
      page.querySelectorAll(REVEAL_TARGETS).forEach((block) => {
        if (watchedBlocks.has(block) || block.dataset.reveal === SHOWN) return
        watchedBlocks.add(block)
        block.dataset.reveal = PENDING
        revealer.observe(block)
      })
    const showEverything = () =>
      page.querySelectorAll(`[data-reveal='${PENDING}']`).forEach((block) => {
        block.dataset.reveal = SHOWN
      })

    watchNewBlocks()
    const newBlocksWatcher = new MutationObserver(watchNewBlocks)
    newBlocksWatcher.observe(page, { childList: true, subtree: true })
    // En s'arrêtant, le crochet ne laisse rien de caché derrière lui.
    return () => {
      revealer.disconnect()
      newBlocksWatcher.disconnect()
      showEverything()
    }
  }, [pageRef])
}
