import { useRef } from 'react'

import { useHasOverflow } from '../../hooks/useHasOverflow'

// Zone qui défile à l'intérieur d'un bloc de hauteur fixe : la liste peut
// grandir sans pousser les blocs voisins. Un fondu en bas signale qu'il reste
// du contenu, uniquement quand c'est le cas.
function ScrollArea({ label, className = '', children }) {
  const scrollRef = useRef(null)
  const hasOverflow = useHasOverflow(scrollRef)

  return (
    <div className={`relative min-h-0 flex-1 ${className}`}>
      <div
        ref={scrollRef}
        role="region"
        aria-label={label}
        tabIndex={hasOverflow ? 0 : undefined}
        className="h-full overflow-y-auto overscroll-contain pr-1"
      >
        {children}
      </div>
      {hasOverflow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-surface to-transparent"
        />
      )}
    </div>
  )
}

export default ScrollArea
