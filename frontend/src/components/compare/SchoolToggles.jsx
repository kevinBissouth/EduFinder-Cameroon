import { useState } from 'react'
import { Check, Heart, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useSchoolSelection } from '../../hooks/useSchoolSelection'

const TOGGLE_BASE_CLASSES =
  'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border text-sm font-semibold transition active:scale-95'
const IDLE_CLASSES = 'border-line bg-surface text-navy hover:border-primary hover:text-primary-deep'

// L'icône rebondit et lance son éclat quand on vient d'activer le bouton,
// pas à chaque affichage : une liste de favoris déjà cochés ne doit pas se
// mettre à pétiller en s'ouvrant.
function usePressFeedback(isActive) {
  const [wasPressed, setWasPressed] = useState(false)
  return { isCelebrating: wasPressed && isActive, notePress: () => setWasPressed(true) }
}

const SPARK_COUNT = 12
const FULL_TURN_DEGREES = 360
const SPARK_ANGLES = Array.from(
  { length: SPARK_COUNT },
  (_, sparkIndex) => `${(sparkIndex * FULL_TURN_DEGREES) / SPARK_COUNT}deg`,
)

// Les ondes et les particules qui partent de l'icône. Elles n'existent dans
// la page que le temps de la fête : rien ne traîne sur les autres cartes.
function PressBurst() {
  return (
    <span aria-hidden="true" className="press-burst">
      {SPARK_ANGLES.map((sparkAngle) => (
        <span key={sparkAngle} className="press-spark" style={{ '--spark-angle': sparkAngle }} />
      ))}
    </span>
  )
}

// L'icône d'un bouton, avec son rebond et son éclat au moment de l'activation.
// L'éclat est posé à côté de l'icône, pas dedans : il grossirait et
// pivoterait avec elle.
function CelebratedIcon({ isCelebrating, children }) {
  return (
    <span className="relative flex">
      <span className={`flex ${isCelebrating ? 'animate-pop' : ''}`}>{children}</span>
      {isCelebrating && <PressBurst />}
    </span>
  )
}

// Bouton « Comparer » d'un établissement, le même sur les cartes et sur la
// fiche. Son libellé ne change pas : c'est l'état enfoncé (fond plein, coche)
// qui dit que l'établissement est dans la comparaison.
export function CompareToggle({ schoolId, className = '' }) {
  const { t } = useTranslation('compare')
  const { comparedIds, toggleCompared } = useSchoolSelection()
  const isCompared = comparedIds.includes(schoolId)
  const ToggleIcon = isCompared ? Check : Scale
  const { isCelebrating, notePress } = usePressFeedback(isCompared)
  const toggle = () => {
    notePress()
    toggleCompared(schoolId)
  }

  return (
    <button
      type="button"
      aria-pressed={isCompared}
      title={isCompared ? t('toggle.removeFromComparison') : t('toggle.addToComparison')}
      onClick={toggle}
      className={`${TOGGLE_BASE_CLASSES} px-4 ${className} ${isCelebrating ? 'animate-squash' : ''} ${
        isCompared ? 'border-primary bg-primary text-white hover:bg-primary-deep' : IDLE_CLASSES
      }`}
    >
      <CelebratedIcon isCelebrating={isCelebrating}>
        <ToggleIcon aria-hidden="true" className="size-4" />
      </CelebratedIcon>
      {t('toggle.compare')}
    </button>
  )
}

export function SaveToggle({ schoolId, className = '' }) {
  const { t } = useTranslation('compare')
  const { savedIds, toggleSaved } = useSchoolSelection()
  const isSaved = savedIds.includes(schoolId)
  const label = isSaved ? t('toggle.unsave') : t('toggle.save')
  const { isCelebrating, notePress } = usePressFeedback(isSaved)
  const toggle = () => {
    notePress()
    toggleSaved(schoolId)
  }

  return (
    <button
      type="button"
      aria-pressed={isSaved}
      aria-label={label}
      title={label}
      onClick={toggle}
      className={`${TOGGLE_BASE_CLASSES} w-11 min-w-11 ${className} ${isCelebrating ? 'animate-squash' : ''} ${
        isSaved ? 'border-primary bg-primary-soft text-primary-deep' : IDLE_CLASSES
      }`}
    >
      <CelebratedIcon isCelebrating={isCelebrating}>
        <Heart aria-hidden="true" className="size-4" fill={isSaved ? 'currentColor' : 'none'} />
      </CelebratedIcon>
    </button>
  )
}
