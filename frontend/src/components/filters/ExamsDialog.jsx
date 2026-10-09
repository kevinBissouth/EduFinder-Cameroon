import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SelectionIndicator } from './OptionRow'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import { formatPercent } from '../../utils/format'

const DEFAULT_MINIMUM_RATE = '50'
const RATE_STEP = 5
const SCALE_MARKS = [0, 25, 50, 75, 100]

// Un examen de la liste. Coché, il montre son curseur : on règle le taux
// minimum sans rien taper, ce qui compte sur téléphone.
function ExamRow({ exam, minimumRate, onToggle, onRateChange }) {
  const { t } = useTranslation('home')
  const translateReference = useReferenceLabel()
  const isSelected = minimumRate != null
  const examName = translateReference('exams', exam.name)

  return (
    <li
      className={`rounded-control border transition-colors ${isSelected ? 'border-primary bg-primary-soft/60' : 'border-line bg-surface hover:border-primary'}`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={isSelected}
        onClick={onToggle}
        className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-control px-4 text-left text-base font-semibold text-navy"
      >
        <SelectionIndicator role="checkbox" isSelected={isSelected} />
        <span className="flex-1">{examName}</span>
        {isSelected && (
          <span className="font-display text-xl tabular-nums text-primary-deep">
            {t('filters.atLeast', { rate: formatPercent(minimumRate) })}
          </span>
        )}
      </button>
      {isSelected && (
        <div className="px-4 pb-4">
          <input
            type="range"
            min="0"
            max="100"
            step={RATE_STEP}
            value={minimumRate}
            aria-label={t('filters.minimumPassRateFor', { exam: examName })}
            onChange={(event) => onRateChange(event.target.value)}
            className="h-11 w-full cursor-pointer accent-primary"
          />
          <div aria-hidden="true" className="flex justify-between text-xs tabular-nums text-ink-soft">
            {SCALE_MARKS.map((mark) => (
              <span key={mark}>{formatPercent(mark)}</span>
            ))}
          </div>
        </div>
      )}
    </li>
  )
}

function toRateByExamId(requirements) {
  return Object.fromEntries(
    requirements.map((requirement) => [String(requirement.examId), String(requirement.minRate)]),
  )
}

// Fenêtre des examens. Les réglages restent un brouillon tant qu'on n'a pas
// appliqué : fermer la fenêtre ne change rien à la recherche en cours.
function ExamsDialog({ icon, exams, requirements, typeName, onApply, onClose }) {
  const { t } = useTranslation('home')
  const translateReference = useReferenceLabel()
  const [rateByExamId, setRateByExamId] = useState(() => toRateByExamId(requirements))

  const toggleExam = (examId) =>
    setRateByExamId(({ [examId]: currentRate, ...otherRates }) =>
      currentRate == null ? { ...otherRates, [examId]: DEFAULT_MINIMUM_RATE } : otherRates,
    )
  const changeRate = (examId, rate) => setRateByExamId((current) => ({ ...current, [examId]: rate }))
  const applyAndClose = (nextRateByExamId) => {
    // Je ne garde que les examens encore proposés : un examen coché avant un
    // changement de type ne doit pas filtrer en cachette.
    const offeredRequirements = exams
      .filter((exam) => nextRateByExamId[exam.id] != null)
      .map((exam) => ({ examId: String(exam.id), minRate: nextRateByExamId[exam.id] }))
    onApply(offeredRequirements)
    onClose()
  }

  return (
    <Modal
      icon={icon}
      title={t('filters.examPassRate')}
      description={
        typeName
          ? t('filters.examsForType', { type: translateReference('types', typeName) })
          : t('filters.examsHint')
      }
      size="md"
      onClose={onClose}
      footer={
        <div className="flex justify-between gap-2">
          <Button variant="ghost" onClick={() => applyAndClose({})}>
            {t('filters.clear')}
          </Button>
          <Button onClick={() => applyAndClose(rateByExamId)}>{t('filters.apply')}</Button>
        </div>
      }
    >
      {exams.length === 0 && <p className="text-sm font-semibold text-navy">{t('filters.noExamForType')}</p>}
      <ul className="space-y-2">
        {exams.map((exam) => (
          <ExamRow
            key={exam.id}
            exam={exam}
            minimumRate={rateByExamId[exam.id]}
            onToggle={() => toggleExam(String(exam.id))}
            onRateChange={(rate) => changeRate(String(exam.id), rate)}
          />
        ))}
      </ul>
    </Modal>
  )
}

export default ExamsDialog
