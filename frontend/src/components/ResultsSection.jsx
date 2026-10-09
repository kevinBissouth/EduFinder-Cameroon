import { useState } from 'react'
import { CircleAlert, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import InstitutionCard from './InstitutionCard'
import Button from './ui/Button'
import RemovableChip from './ui/Chip'
import Container from './ui/Container'
import { Eyebrow } from './ui/SectionHeading'
import StateMessage from './ui/StateMessage'
import { useReferenceLabel } from '../hooks/useReferenceLabel'

const PAGE_SIZE = 6
const GRID_CLASSES = 'mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3'

function describeBudget(minFee, maxFee, t) {
  if (minFee && maxFee) return t('results.budgetRange', { minimum: minFee, maximum: maxFee })
  if (minFee) return t('results.budgetFrom', { minimum: minFee })
  return t('results.budgetUpTo', { maximum: maxFee })
}

// Chaque critère actif devient une pastille qui le retire. Les clés sont
// celles qu'attend handleRemoveFilter dans useInstitutions.
function listActiveFilters(filters, t, translateReference) {
  const findExamName = (examId) => {
    const examKey = filters.examMeta.find((exam) => String(exam.id) === String(examId))?.name
    return examKey ? translateReference('exams', examKey) : t('results.unknownExam', { id: examId })
  }

  return [
    filters.appliedSearch.trim() && { key: 'q', label: `"${filters.appliedSearch.trim()}"` },
    filters.activeCity && { key: 'city', label: filters.activeCity.name },
    filters.activeType && {
      key: 'type',
      label: translateReference('types', filters.activeType.name),
    },
    filters.activeLang && {
      key: 'lang',
      label: translateReference('sections', filters.activeLang.name),
    },
    filters.activeSector && {
      key: 'sector',
      label: translateReference('sectors', filters.activeSector.name),
    },
    filters.activeRegion && {
      key: 'region',
      label: translateReference('regions', filters.activeRegion.name),
    },
    (filters.minFee || filters.maxFee) && {
      key: 'budget',
      label: describeBudget(filters.minFee, filters.maxFee, t),
    },
    ...filters.serviceNames.map((serviceName) => ({ key: 'services', label: serviceName })),
    ...filters.examRequirements.map((requirement) => ({
      key: 'exams',
      label: t('results.examAtLeast', {
        exam: findExamName(requirement.examId),
        rate: requirement.minRate,
      }),
    })),
  ].filter(Boolean)
}

function ActiveFilters({ filters, onRemoveFilter, onReset }) {
  const { t } = useTranslation('home')
  const translateReference = useReferenceLabel()
  const activeFilters = listActiveFilters(filters, t, translateReference)
  if (activeFilters.length === 0) return null

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {activeFilters.map((filter) => (
        <RemovableChip
          key={`${filter.key}-${filter.label}`}
          label={filter.label}
          onRemove={() => onRemoveFilter(filter.key)}
        />
      ))}
      <Button variant="ghost" onClick={onReset} className="sm:h-9">
        {t('results.clearFilters')}
      </Button>
    </div>
  )
}

// Raccourcis vers les types d'établissement les plus représentés : un clic
// applique le filtre, un second clic le retire.
function TypeTabs({ types, activeTypeId, onToggleType }) {
  const { t } = useTranslation('home')
  const translateReference = useReferenceLabel()
  if (types.length === 0) return null

  return (
    <div role="group" aria-label={t('results.filterByType')} className="mt-8 flex flex-wrap gap-2">
      {types.map((type) => {
        const isActive = String(type.id) === String(activeTypeId)
        return (
          <button
            key={type.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggleType(type.id)}
            className={`h-11 cursor-pointer rounded-full border px-4 text-sm font-semibold transition-colors ${
              isActive
                ? 'border-navy bg-navy text-white'
                : 'border-line bg-surface text-navy hover:border-primary hover:text-primary-deep'
            }`}
          >
            {translateReference('types', type.name)}
          </button>
        )
      })}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-panel border border-line bg-surface">
      <div className="aspect-4/3 bg-muted" />
      <div className="space-y-4 p-6">
        <div className="h-3 w-1/2 rounded-full bg-paper" />
        <div className="h-7 w-3/4 rounded-control bg-paper" />
        <div className="h-16 rounded-control bg-paper" />
        <div className="h-11 rounded-control bg-paper" />
      </div>
    </div>
  )
}

function ResultsSection({
  status,
  institutions,
  filters,
  typeTabs,
  onRemoveFilter,
  onReset,
  onRetry,
  onView,
  comparedIds,
  onToggleCompare,
}) {
  const { t } = useTranslation('home')
  // Le nombre de cartes affichées est mémorisé AVEC la liste qu'il concerne :
  // dès que les résultats changent, on repart de la première page sans effet.
  const [expansion, setExpansion] = useState({ institutions: null, visibleCount: PAGE_SIZE })
  const visibleCount =
    expansion.institutions === institutions ? expansion.visibleCount : PAGE_SIZE
  const visibleInstitutions = institutions.slice(0, visibleCount)
  const hiddenCount = institutions.length - visibleInstitutions.length
  const showMore = () => setExpansion({ institutions, visibleCount: visibleCount + PAGE_SIZE })
  const heading =
    status === 'success' ? t('results.found', { count: institutions.length }) : t('results.heading')

  return (
    <section id="results" className="scroll-mt-20 bg-surface py-16 sm:py-20">
      <Container>
        <Eyebrow>{t('results.eyebrow')}</Eyebrow>
        <h2
          aria-live="polite"
          className="mt-4 font-display text-3xl leading-display tracking-tight tabular-nums text-navy sm:text-5xl"
        >
          {heading}
        </h2>
        {status === 'success' && institutions.length > 0 && (
          <p className="mt-4 text-base text-ink sm:text-lg">{t('results.completeFirst')}</p>
        )}
        <TypeTabs
          types={typeTabs.types}
          activeTypeId={typeTabs.activeTypeId}
          onToggleType={typeTabs.onToggleType}
        />
        <ActiveFilters filters={filters} onRemoveFilter={onRemoveFilter} onReset={onReset} />

        {status === 'loading' && (
          <div aria-busy="true" aria-label={t('results.loading')} className={GRID_CLASSES}>
            {Array.from({ length: PAGE_SIZE }, (_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8">
            <StateMessage
              tone="danger"
              icon={CircleAlert}
              title={t('results.errorTitle')}
              description={t('results.errorDescription')}
              actionLabel={t('results.retry')}
              onAction={onRetry}
            />
          </div>
        )}

        {status === 'success' && institutions.length === 0 && (
          <div className="mt-8">
            <StateMessage
              icon={SearchX}
              title={t('results.emptyTitle')}
              description={t('results.emptyDescription')}
              actionLabel={t('results.clearFilters')}
              onAction={onReset}
            />
          </div>
        )}

        {status === 'success' && institutions.length > 0 && (
          <>
            <div className={GRID_CLASSES}>
              {visibleInstitutions.map((institution) => (
                <InstitutionCard
                  key={institution.uuid}
                  institution={institution}
                  isCompared={comparedIds.includes(institution.uuid)}
                  onToggleCompare={() => onToggleCompare(institution.uuid)}
                  onView={onView}
                />
              ))}
            </div>
            {hiddenCount > 0 && (
              <div className="mt-8 flex justify-center">
                <Button variant="secondary" onClick={showMore} className="rounded-full">
                  {t('results.showMore', { count: Math.min(PAGE_SIZE, hiddenCount) })}
                </Button>
              </div>
            )}
          </>
        )}
      </Container>
    </section>
  )
}

export default ResultsSection
