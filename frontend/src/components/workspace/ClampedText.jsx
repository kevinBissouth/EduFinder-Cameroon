import { useState } from 'react'

import Modal from './Modal'
import { useIsDesktop } from '../../hooks/useIsDesktop'

// En dessous de ces longueurs, le texte tient dans la place prévue : inutile
// de proposer de le lire en entier. Un grand écran en montre davantage.
const COLLAPSE_THRESHOLD_ON_PHONE = 220
const COLLAPSE_THRESHOLD_ON_DESKTOP = 480

// Texte long replié, avec un bouton pour le lire en entier : sur téléphone il
// se déplie sur place, sur grand écran il s'ouvre dans une fenêtre défilante.
function ClampedText({ text, title, className = '' }) {
  const isDesktop = useIsDesktop()
  const [isOpen, setIsOpen] = useState(false)
  const threshold = isDesktop ? COLLAPSE_THRESHOLD_ON_DESKTOP : COLLAPSE_THRESHOLD_ON_PHONE
  const isCollapsible = text.length > threshold
  const isExpandedInPlace = isOpen && !isDesktop
  const textClasses = `whitespace-pre-line text-pretty ${className}`

  return (
    <>
      <p
        className={`${textClasses} ${
          isCollapsible && !isExpandedInPlace ? 'line-clamp-4 lg:line-clamp-6' : ''
        }`}
      >
        {text}
      </p>
      {isCollapsible && (
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          className="-ml-2 mt-1 min-h-11 cursor-pointer rounded-control px-2 text-sm font-semibold text-primary-deep hover:bg-primary-soft"
        >
          {isExpandedInPlace ? 'Show less' : 'Show more'}
        </button>
      )}
      {isOpen && isDesktop && (
        <Modal title={title} onClose={() => setIsOpen(false)}>
          <p className={textClasses}>{text}</p>
        </Modal>
      )}
    </>
  )
}

export default ClampedText
