import { useRef } from 'react'
import { CircleAlert, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from '../ui/Button'
import Container from '../ui/Container'
import { useElementHeight } from '../../hooks/useElementHeight'
import { useSchoolSelection } from '../../hooks/useSchoolSelection'
import {
  MAX_COMPARED_SCHOOLS,
  buildComparisonPath,
  canCompare,
} from '../../utils/comparison'

const NAME_SEPARATOR = ', '
const COMPARE_BUTTON_CLASSES =
  'flex-1 rounded-full disabled:bg-white/15 disabled:text-on-navy-soft disabled:opacity-100 sm:flex-none'

// Un refus (comparaison pleine) est une alerte, sur fond ambre ; le simple
// rappel « il en faut un second » reste une note discrète.
function SelectionStatus({ selection }) {
  const { t } = useTranslation('compare')

  if (selection.wasAdditionRefused) {
    return (
      <p
        role="alert"
        className="mt-1.5 inline-flex items-center gap-1.5 rounded-control bg-accent px-3 py-1.5 text-xs font-bold text-navy"
      >
        <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
        {t('bar.full', { maximum: MAX_COMPARED_SCHOOLS })}
      </p>
    )
  }
  if (canCompare(selection.comparedIds)) return null
  return <p className="text-sm text-on-navy-soft">{t('bar.needOneMore')}</p>
}

function CompareAction({ comparedIds }) {
  const { t } = useTranslation('compare')

  if (!canCompare(comparedIds)) {
    return (
      <Button variant="accent" className={COMPARE_BUTTON_CLASSES} disabled>
        {t('bar.compare')}
      </Button>
    )
  }
  return (
    <Button as="a" href={buildComparisonPath(comparedIds)} variant="accent" className={COMPARE_BUTTON_CLASSES}>
      {t('bar.compare')}
    </Button>
  )
}

// La liste des noms n'apparaît que si je les connais tous : sur une fiche, la
// page ne connaît que son propre établissement, et une liste partielle
// laisserait croire que les autres ont disparu.
function listSelectedNames(comparedIds, schools) {
  const selectedNames = comparedIds
    .map((schoolId) => schools.find((school) => school.uuid === schoolId)?.name)
    .filter(Boolean)
  return selectedNames.length === comparedIds.length ? selectedNames.join(NAME_SEPARATOR) : ''
}

function SelectionBarPanel({ schools }) {
  const { t } = useTranslation('compare')
  const selection = useSchoolSelection()
  const { comparedIds } = selection
  const panelRef = useRef(null)
  const panelHeight = useElementHeight(panelRef)

  return (
    <>
      {/* Ce bloc réserve la hauteur exacte de la barre, pour qu'elle ne masque
          jamais le bas de la page ; il prolonge le pied de page, d'où sa couleur. */}
      <div aria-hidden="true" className="bg-navy" style={{ height: panelHeight }} />
      <section
        ref={panelRef}
        aria-label={t('bar.label')}
        className="fixed inset-x-0 bottom-0 z-40 animate-bar-rise border-t border-white/10 bg-navy [view-transition-name:selection-bar] pb-[env(safe-area-inset-bottom)] text-white shadow-raised [--focus-ring:var(--color-accent)]"
      >
        <Container className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 sm:flex-1">
            <p className="flex items-center gap-2 text-sm font-bold">
              <Scale aria-hidden="true" className="size-4 shrink-0" />
              {t('bar.selected', { count: comparedIds.length })}
            </p>
            <p className="hidden truncate text-sm text-on-navy-soft sm:block">
              {listSelectedNames(comparedIds, schools)}
            </p>
            <SelectionStatus selection={selection} />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => selection.replaceCompared([])}
              className="min-h-11 cursor-pointer rounded-button px-3 text-sm font-semibold text-on-navy-soft hover:text-white"
            >
              {t('bar.clear')}
            </button>
            <CompareAction comparedIds={comparedIds} />
          </div>
        </Container>
      </section>
    </>
  )
}

// Barre fixée en bas de l'écran dès qu'un établissement est sélectionné : elle
// dit où en est la sélection et mène à la comparaison.
function SelectionBar({ schools }) {
  const { comparedIds } = useSchoolSelection()

  if (comparedIds.length === 0) return null
  return <SelectionBarPanel schools={schools} />
}

export default SelectionBar
