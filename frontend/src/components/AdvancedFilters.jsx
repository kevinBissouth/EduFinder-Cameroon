import { useState } from 'react'
import { ClipboardCheck, ConciergeBell, Landmark, Languages, MapPin, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import BudgetDialog from './filters/BudgetDialog'
import ChoiceDialog from './filters/ChoiceDialog'
import ExamsDialog from './filters/ExamsDialog'
import FilterButton from './filters/FilterButton'
import ServicesDialog from './filters/ServicesDialog'
import { translateOptionNames, useReferenceLabel } from '../hooks/useReferenceLabel'
import { listExamsForType } from '../utils/examRules'
import { describeBudget } from './filters/budgetLabels'
import { findSelectedName } from './filters/choiceLabels'
import { formatPercent } from '../utils/format'

// Avec un seul examen, le bouton dit lequel et à quel taux ; au-delà, leur nombre.
function describeExams(examRequirements, exams, { t, translateReference }) {
  if (examRequirements.length === 0) return t('filters.any')
  if (examRequirements.length > 1) return t('filters.selected', { count: examRequirements.length })
  const [requirement] = examRequirements
  const exam = exams.find((listedExam) => String(listedExam.id) === String(requirement.examId))
  const examName = exam ? translateReference('exams', exam.name) : t('filters.exam')
  return `${examName} ${t('filters.atLeast', { rate: formatPercent(requirement.minRate) })}`
}

// Les trois filtres à choix unique ont la même forme : seules changent leurs
// données. Les décrire en liste évite trois blocs de code identiques.
function listChoiceFilters(advancedFilters, { t, translateReference }) {
  const { meta } = advancedFilters
  return [
    {
      id: 'section',
      removalKey: 'lang',
      icon: Languages,
      label: t('filters.languageSection'),
      description: t('filters.sectionHint'),
      anyLabel: t('filters.allSections'),
      options: translateOptionNames(meta.languages, 'sections', translateReference),
      selectedId: advancedFilters.sectionId,
      onSelect: advancedFilters.onSectionChange,
    },
    {
      id: 'sector',
      removalKey: 'sector',
      icon: Landmark,
      label: t('filters.sector'),
      description: t('filters.sectorHint'),
      anyLabel: t('filters.allSectors'),
      options: translateOptionNames(meta.sectors, 'sectors', translateReference),
      selectedId: advancedFilters.sectorId,
      onSelect: advancedFilters.onSectorChange,
    },
    {
      id: 'region',
      removalKey: 'region',
      icon: MapPin,
      label: t('filters.region'),
      description: t('filters.regionHint'),
      anyLabel: t('filters.allRegions'),
      options: translateOptionNames(meta.regions, 'regions', translateReference),
      selectedId: advancedFilters.regionId,
      onSelect: advancedFilters.onRegionChange,
    },
  ]
}

// Filtres avancés : six boutons, chacun ouvre sa fenêtre de choix (une seule
// à la fois, d'où un seul état). Rien ne s'ouvre plus par-dessus la page.
function AdvancedFilters({ advancedFilters }) {
  const { t } = useTranslation('home')
  const translateReference = useReferenceLabel()
  const [openFilterId, setOpenFilterId] = useState(null)
  const closeDialog = () => setOpenFilterId(null)
  const { meta, minFee, maxFee, serviceNames, examRequirements, selectedTypeName, onRemoveFilter } =
    advancedFilters
  const translators = { t, translateReference }
  const choiceFilters = listChoiceFilters(advancedFilters, translators)
  const openChoiceFilter = choiceFilters.find((choiceFilter) => choiceFilter.id === openFilterId)
  const offeredExams = listExamsForType(meta.exams, meta.exam_allowed_types, selectedTypeName)

  return (
    <>
      <p className="mb-4 text-sm text-ink-soft">{t('filters.appliedAtOnce')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {choiceFilters.map((choiceFilter) => (
          <FilterButton
            key={choiceFilter.id}
            icon={choiceFilter.icon}
            label={choiceFilter.label}
            value={findSelectedName(choiceFilter)}
            isActive={Boolean(choiceFilter.selectedId)}
            onOpen={() => setOpenFilterId(choiceFilter.id)}
            onClear={() => onRemoveFilter(choiceFilter.removalKey)}
          />
        ))}
        <FilterButton
          icon={Wallet}
          label={t('filters.yearlyBudget')}
          value={describeBudget(minFee, maxFee, t)}
          isActive={Boolean(minFee || maxFee)}
          onOpen={() => setOpenFilterId('budget')}
          onClear={() => onRemoveFilter('budget')}
        />
        <FilterButton
          icon={ConciergeBell}
          label={t('filters.services')}
          value={
            serviceNames.length > 0
              ? t('filters.selected', { count: serviceNames.length })
              : t('filters.any')
          }
          isActive={serviceNames.length > 0}
          onOpen={() => setOpenFilterId('services')}
          onClear={() => onRemoveFilter('services')}
        />
        <FilterButton
          icon={ClipboardCheck}
          label={t('filters.examPassRate')}
          value={describeExams(examRequirements, meta.exams, translators)}
          isActive={examRequirements.length > 0}
          onOpen={() => setOpenFilterId('exams')}
          onClear={() => onRemoveFilter('exams')}
        />
      </div>

      {openChoiceFilter && (
        <ChoiceDialog
          icon={openChoiceFilter.icon}
          title={openChoiceFilter.label}
          description={openChoiceFilter.description}
          anyLabel={openChoiceFilter.anyLabel}
          options={openChoiceFilter.options}
          selectedId={openChoiceFilter.selectedId}
          onSelect={openChoiceFilter.onSelect}
          onClose={closeDialog}
        />
      )}
      {openFilterId === 'budget' && (
        <BudgetDialog
          icon={Wallet}
          minFee={minFee}
          maxFee={maxFee}
          onApply={advancedFilters.onApplyBudget}
          onClose={closeDialog}
        />
      )}
      {openFilterId === 'services' && (
        <ServicesDialog
          icon={ConciergeBell}
          services={meta.services}
          selectedNames={serviceNames}
          onToggle={advancedFilters.onToggleService}
          onClose={closeDialog}
        />
      )}
      {openFilterId === 'exams' && (
        <ExamsDialog
          icon={ClipboardCheck}
          exams={offeredExams}
          requirements={examRequirements}
          typeName={selectedTypeName}
          onApply={advancedFilters.onApplyExams}
          onClose={closeDialog}
        />
      )}
    </>
  )
}

export default AdvancedFilters
