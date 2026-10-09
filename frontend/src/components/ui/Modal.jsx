import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Fenêtre modale du site : feuille en bas d'écran sur téléphone, centrée
// au-delà. Elle se ferme par Échap, par le bouton ou par un clic sur le voile.
// Elle est rendue à la racine du document : un ancêtre animé ou transformé
// (le haut de la page d'accueil) piégerait sinon son positionnement fixe, et
// la fenêtre ne couvrirait plus tout l'écran.
const SIZE_CLASSES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-4xl' }

function Modal({ icon: Icon, title, description, headerExtra, footer, size = 'md', onClose, children }) {
  const { t } = useTranslation('common')
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

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-end justify-center font-sans text-ink sm:items-center sm:p-4">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 animate-veil-fade bg-navy/60 backdrop-blur-xs"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex max-h-[90svh] w-full animate-sheet-rise flex-col rounded-t-panel bg-surface shadow-raised sm:rounded-panel ${SIZE_CLASSES[size]}`}
      >
        {/* Petite poignée : sur téléphone elle dit que la feuille vient du bas. */}
        <span aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line sm:hidden" />
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 pb-4 pt-3 sm:pt-5">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-linear-to-br from-primary to-violet-deep text-white shadow-glow">
                <Icon aria-hidden="true" className="size-5" />
              </span>
            )}
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-2xl text-navy text-balance">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
              {headerExtra}
            </div>
          </div>
          <button
            type="button"
            autoFocus
            aria-label={t('close')}
            onClick={onClose}
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-soft hover:bg-muted hover:text-navy"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-line p-5">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
