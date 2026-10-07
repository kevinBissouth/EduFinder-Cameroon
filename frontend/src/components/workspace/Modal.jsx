import { useEffect, useId } from 'react'
import { X } from 'lucide-react'

// Fenêtre modale des espaces privés : plein bas d'écran sur téléphone, centrée
// au-delà. Elle se ferme par Échap, par le bouton ou par un clic sur le voile.
const SIZE_CLASSES = { md: 'max-w-xl', lg: 'max-w-4xl' }

function Modal({ title, headerExtra, footer, size = 'md', onClose, children }) {
  const titleId = useId()

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    // La page ne doit pas défiler derrière la fenêtre.
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-navy/60" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex max-h-[90vh] w-full flex-col rounded-t-panel bg-surface shadow-raised sm:rounded-panel ${SIZE_CLASSES[size]}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-2xl text-navy text-balance">
              {title}
            </h2>
            {headerExtra}
          </div>
          <button
            type="button"
            autoFocus
            aria-label="Close"
            onClick={onClose}
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-soft hover:bg-muted hover:text-navy"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-line p-5">{footer}</div>}
      </div>
    </div>
  )
}

export default Modal
