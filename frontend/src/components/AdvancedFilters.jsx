import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from './ui/Button'
import { CONTROL_CLASSES, SelectField, TextField } from './ui/Field'
import { translateOptionNames, useReferenceLabel } from '../hooks/useReferenceLabel'

const EMPTY_EXAM_REQUIREMENT = { examId: '', minRate: '' }

// La base contient deux lignes pour le secteur privé (« private », « privé »)
// et la recherche les regroupe déjà : je n'en propose qu'une dans la liste.
function keepFirstOptionPerName(options) {
  const seenNames = new Set()
  return options.filter((option) => {
    if (seenNames.has(option.name)) return false
    seenNames.add(option.name)
    return true
  })
}

// Critère dont la saisie demande plus qu'une liste : le bouton ouvre un
// panneau de la même largeur que lui, qui se referme au clic extérieur ou
// avec la touche Échap.
function PopoverFilter({ label, activeCount, children }) {
  const { t } = useTranslation('home')
  const [isOpen, setIsOpen] = useState(false)
  const close = () => setIsOpen(false)

  return (
    <div
      className="relative flex w-full flex-col gap-1.5"
      onKeyDown={(event) => {
        if (event.key === 'Escape') close()
      }}
    >
      <span className="text-sm font-semibold text-navy">{label}</span>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`${CONTROL_CLASSES} flex cursor-pointer items-center justify-between gap-2 text-left`}
      >
        <span>
          {activeCount > 0 ? t('filters.selected', { count: activeCount }) : t('filters.any')}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 text-ink-soft transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-[70vh] overflow-y-auto rounded-panel border border-line bg-surface p-4 shadow-raised">
            {children({ close })}
          </div>
        </>
      )}
    </div>
  )
}

function BudgetPanel({ minFee, maxFee, onApply }) {
  const { t } = useTranslation('home')
  const [minimumFee, setMinimumFee] = useState(minFee || '')
  const [maximumFee, setMaximumFee] = useState(maxFee || '')

  return (
    <div>
      <div className="grid gap-3">
        <TextField
          label={t('filters.minimumPerYear')}
          type="number"
          min="0"
          step="1000"
          value={minimumFee}
          onChange={(event) => setMinimumFee(event.target.value)}
          placeholder="0"
        />
        <TextField
          label={t('filters.maximumPerYear')}
          type="number"
          min="0"
          step="1000"
          value={maximumFee}
          onChange={(event) => setMaximumFee(event.target.value)}
          placeholder={t('filters.noLimit')}
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onApply('', '')}>
          {t('filters.clear')}
        </Button>
        <Button onClick={() => onApply(minimumFee, maximumFee)}>{t('filters.applyBudget')}</Button>
      </div>
    </div>
  )
}

function ServicesPanel({ services, selectedNames, onToggle }) {
  const { t } = useTranslation('home')

  if (services.length === 0) {
    return <p className="text-sm text-ink-soft">{t('filters.noService')}</p>
  }

  return (
    <ul>
      {services.map((serviceName) => (
        <li key={serviceName}>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-2 text-sm transition-colors hover:bg-muted">
            <input
              type="checkbox"
              checked={selectedNames.includes(serviceName)}
              onChange={() => onToggle(serviceName)}
              className="size-4 accent-primary"
            />
            {serviceName}
          </label>
        </li>
      ))}
    </ul>
  )
}

function ExamRequirementRow({ requirement, exams, onChange, onRemove }) {
  const { t } = useTranslation('home')
  const translateReference = useReferenceLabel()

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label={t('filters.exam')}
        value={requirement.examId}
        onChange={(event) => onChange({ examId: event.target.value })}
        className={`${CONTROL_CLASSES} min-w-0 flex-1`}
      >
        <option value="">{t('filters.exam')}</option>
        {exams.map((exam) => (
          <option key={exam.id} value={exam.id}>
            {translateReference('exams', exam.name)}
          </option>
        ))}
      </select>
      <input
        aria-label={t('filters.minimumPassRate')}
        type="number"
        min="0"
        max="100"
        value={requirement.minRate}
        onChange={(event) => onChange({ minRate: event.target.value })}
        placeholder="%"
        className={`${CONTROL_CLASSES} w-20 shrink-0`}
      />
      <button
        type="button"
        aria-label={t('filters.removeExam')}
        onClick={onRemove}
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-soft transition-colors hover:bg-danger-soft hover:text-danger"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}

function ExamPanel({ exams, requirements, onApply }) {
  const { t } = useTranslation('home')
  const [draftRequirements, setDraftRequirements] = useState(
    requirements.length > 0 ? requirements : [EMPTY_EXAM_REQUIREMENT],
  )

  const updateRequirement = (changedIndex, changes) =>
    setDraftRequirements((current) =>
      current.map((requirement, index) =>
        index === changedIndex ? { ...requirement, ...changes } : requirement,
      ),
    )
  const removeRequirement = (removedIndex) =>
    setDraftRequirements((current) => current.filter((_, index) => index !== removedIndex))
  const addRequirement = () =>
    setDraftRequirements((current) => [...current, EMPTY_EXAM_REQUIREMENT])
  // Une ligne incomplète n'est pas un critère : seules les lignes ayant un
  // examen ET un taux sont envoyées.
  const applyCompleteRequirements = () =>
    onApply(draftRequirements.filter((requirement) => requirement.examId && requirement.minRate))

  return (
    <div>
      <div className="grid gap-2">
        {draftRequirements.map((requirement, index) => (
          <ExamRequirementRow
            key={index}
            requirement={requirement}
            exams={exams}
            onChange={(changes) => updateRequirement(index, changes)}
            onRemove={() => removeRequirement(index)}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <Button variant="ghost" onClick={addRequirement}>
          {t('filters.addExam')}
        </Button>
        <Button onClick={applyCompleteRequirements}>{t('filters.applyPassRates')}</Button>
      </div>
    </div>
  )
}

function AdvancedFilters({ advancedFilters }) {
  const { t } = useTranslation('home')
  const translateReference = useReferenceLabel()
  const {
    meta,
    sectionId,
    sectorId,
    regionId,
    minFee,
    maxFee,
    serviceNames,
    examRequirements,
    onSectionChange,
    onSectorChange,
    onRegionChange,
    onApplyBudget,
    onToggleService,
    onApplyExams,
  } = advancedFilters

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SelectField
        label={t('filters.languageSection')}
        value={sectionId}
        onChange={(event) => onSectionChange(event.target.value)}
        placeholder={t('filters.allSections')}
        options={translateOptionNames(meta.languages, 'sections', translateReference)}
      />
      <SelectField
        label={t('filters.sector')}
        value={sectorId}
        onChange={(event) => onSectorChange(event.target.value)}
        placeholder={t('filters.allSectors')}
        options={keepFirstOptionPerName(
          translateOptionNames(meta.sectors, 'sectors', translateReference),
        )}
      />
      <SelectField
        label={t('filters.region')}
        value={regionId}
        onChange={(event) => onRegionChange(event.target.value)}
        placeholder={t('filters.allRegions')}
        options={translateOptionNames(meta.regions, 'regions', translateReference)}
      />
      <PopoverFilter label={t('filters.yearlyBudget')} activeCount={minFee || maxFee ? 1 : 0}>
        {({ close }) => (
          <BudgetPanel
            minFee={minFee}
            maxFee={maxFee}
            onApply={(minimumFee, maximumFee) => {
              onApplyBudget(minimumFee, maximumFee)
              close()
            }}
          />
        )}
      </PopoverFilter>
      <PopoverFilter label={t('filters.services')} activeCount={serviceNames.length}>
        {() => (
          <ServicesPanel
            services={meta.services}
            selectedNames={serviceNames}
            onToggle={onToggleService}
          />
        )}
      </PopoverFilter>
      <PopoverFilter label={t('filters.examPassRate')} activeCount={examRequirements.length}>
        {({ close }) => (
          <ExamPanel
            exams={meta.exams}
            requirements={examRequirements}
            onApply={(requirements) => {
              onApplyExams(requirements)
              close()
            }}
          />
        )}
      </PopoverFilter>
    </div>
  )
}

export default AdvancedFilters
