import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import Modal from './Modal'
import { useIsDesktop } from '../../hooks/useIsDesktop'

const SHOW_BUTTON_CLASSES =
  '-ml-2 mt-3 min-h-11 cursor-pointer rounded-control px-2 text-sm font-semibold text-primary-deep hover:bg-primary-soft'

// Liste dont seuls les premiers éléments sont affichés, pour qu'un bloc très
// fourni ne déforme pas la page. Le reste se dévoile de deux façons : sur
// grand écran, une fenêtre défilante s'ouvre par-dessus la page ; sur
// téléphone, la liste se déplie simplement sur place.
function OverflowList({ items, collapsedCount, title, modalSize, renderItems }) {
  const { t } = useTranslation('workspace')
  const isDesktop = useIsDesktop()
  const [isOpen, setIsOpen] = useState(false)

  if (items.length <= collapsedCount) return renderItems(items)

  const isExpandedInPlace = isOpen && !isDesktop

  return (
    <>
      {renderItems(isExpandedInPlace ? items : items.slice(0, collapsedCount))}
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={SHOW_BUTTON_CLASSES}
      >
        {isExpandedInPlace ? t('showLess') : t('showAll', { count: items.length })}
      </button>
      {isOpen && isDesktop && (
        <Modal title={title} size={modalSize} onClose={() => setIsOpen(false)}>
          {renderItems(items)}
        </Modal>
      )}
    </>
  )
}

export default OverflowList
