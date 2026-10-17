import { ChevronRight, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function findBorderClasses(isActive, hasError) {
  if (hasError) return 'border-danger bg-surface'
  return isActive ? 'border-primary bg-surface shadow-soft' : 'border-line bg-surface'
}

// Un filtre avancé, fermé : son icône, son nom et sa valeur en cours. Il
// ouvre une fenêtre de choix. Quand un critère est posé, la tuile passe au
// bleu et la flèche laisse place à une croix : on retire le critère sans
// rouvrir la fenêtre. La croix est un second bouton, posé à côté du premier
// (un bouton dans un bouton n'est pas valide).
//
// La même tuile sert aux champs à choix des formulaires (ChoiceField), qui
// donnent leur propre nom à la croix et peuvent signaler une erreur. Sans
// onClear, la tuile garde sa flèche : le choix ne se retire pas. Dans une
// ligne de formulaire, isSingleLine garde le texte sur une ligne (coupé s'il
// dépasse) pour que la tuile reste à la hauteur des champs voisins.
function FilterButton({
  icon: Icon,
  label,
  value,
  isActive,
  hasError = false,
  isSingleLine = false,
  describedBy,
  clearLabel: givenClearLabel,
  className = '',
  onOpen,
  onClear,
}) {
  const { t } = useTranslation('home')
  const clearLabel = givenClearLabel ?? t('filters.removeNamed', { filter: label })
  const lineClasses = isSingleLine ? 'truncate' : ''

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-describedby={describedBy}
        aria-invalid={hasError || undefined}
        onClick={onOpen}
        className={`flex min-h-18 w-full min-w-0 cursor-pointer items-center gap-3 rounded-control border py-3 pl-3 pr-12 text-left transition-all hover:border-primary hover:shadow-soft active:scale-[0.99] ${findBorderClasses(
          isActive,
          hasError,
        )}`}
      >
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-control transition-colors ${
            isActive
              ? 'bg-linear-to-br from-primary to-violet-deep text-white shadow-glow'
              : 'bg-muted text-primary-deep'
          }`}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-xs font-medium text-ink-soft ${lineClasses}`}>{label}</span>
          <span
            className={`block text-sm ${lineClasses} ${isActive ? 'font-bold text-primary-deep' : 'font-semibold text-navy'}`}
          >
            {value}
          </span>
        </span>
      </button>
      {isActive && onClear ? (
        <button
          type="button"
          aria-label={clearLabel}
          title={clearLabel}
          onClick={onClear}
          className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-danger-soft hover:text-danger-deep"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : (
        <ChevronRight
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
        />
      )}
    </div>
  )
}

export default FilterButton
