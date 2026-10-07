import { useState } from 'react'
import { CircleAlert, SearchX } from 'lucide-react'

import InstitutionCard from './InstitutionCard'
import Button from './ui/Button'
import RemovableChip from './ui/Chip'
import Container from './ui/Container'
import { Eyebrow } from './ui/SectionHeading'
import StateMessage from './ui/StateMessage'

const PAGE_SIZE = 6
const GRID_CLASSES = 'mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3'

function describeBudget(minFee, maxFee) {
  if (minFee && maxFee) return `${minFee} to ${maxFee} FCFA`
  if (minFee) return `From ${minFee} FCFA`
  return `Up to ${maxFee} FCFA`
}

// Chaque critère actif devient une pastille qui le retire. Les clés sont
// celles qu'attend handleRemoveFilter dans useInstitutions.
function listActiveFilters(filters) {
  const examName = (examId) =>
    filters.examMeta.find((exam) => String(exam.id) === String(examId))?.name ?? `Exam ${examId}`

  return [
    filters.appliedSearch.trim() && { key: 'q', label: `"${filters.appliedSearch.trim()}"` },
    filters.activeCity && { key: 'city', label: filters.activeCity.name },
    filters.activeType && { key: 'type', label: filters.activeType.name },
    filters.activeLang && { key: 'lang', label: filters.activeLang.name },
    filters.activeSector && { key: 'sector', label: filters.activeSector.name },
    filters.activeRegion && { key: 'region', label: filters.activeRegion.name },
    (filters.minFee || filters.maxFee) && {
      key: 'budget',
      label: describeBudget(filters.minFee, filters.maxFee),
    },
    ...filters.serviceNames.map((serviceName) => ({ key: 'services', label: serviceName })),
    ...filters.examRequirements.map((requirement) => ({
      key: 'exams',
      label: `${examName(requirement.examId)} at least ${requirement.minRate}%`,
    })),
  ].filter(Boolean)
}

function ActiveFilters({ filters, onRemoveFilter, onReset }) {
  const activeFilters = listActiveFilters(filters)
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
        Clear all filters
      </Button>
    </div>
  )
}

// Raccourcis vers les types d'établissement les plus représentés : un clic
// applique le filtre, un second clic le retire.
function TypeTabs({ types, activeTypeId, onToggleType }) {
  if (types.length === 0) return null

  return (
    <div role="group" aria-label="Filter by type of school" className="mt-8 flex flex-wrap gap-2">
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
            {type.name}
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

function buildHeading(status, schoolCount) {
  if (status !== 'success') return 'Schools'
  return `${schoolCount} ${schoolCount === 1 ? 'school' : 'schools'} found`
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
  // Le nombre de cartes affichées est mémorisé AVEC la liste qu'il concerne :
  // dès que les résultats changent, on repart de la première page sans effet.
  const [expansion, setExpansion] = useState({ institutions: null, visibleCount: PAGE_SIZE })
  const visibleCount =
    expansion.institutions === institutions ? expansion.visibleCount : PAGE_SIZE
  const visibleInstitutions = institutions.slice(0, visibleCount)
  const hiddenCount = institutions.length - visibleInstitutions.length
  const showMore = () => setExpansion({ institutions, visibleCount: visibleCount + PAGE_SIZE })

  return (
    <section id="results" className="scroll-mt-20 bg-surface py-16 sm:py-20">
      <Container>
        <Eyebrow>Explore</Eyebrow>
        <h2
          aria-live="polite"
          className="mt-4 font-display text-3xl leading-display tracking-tight tabular-nums text-navy sm:text-5xl"
        >
          {buildHeading(status, institutions.length)}
        </h2>
        <p className="mt-4 text-base text-ink sm:text-lg">
          Recommended schools are listed first.
        </p>
        <TypeTabs
          types={typeTabs.types}
          activeTypeId={typeTabs.activeTypeId}
          onToggleType={typeTabs.onToggleType}
        />
        <ActiveFilters filters={filters} onRemoveFilter={onRemoveFilter} onReset={onReset} />

        {status === 'loading' && (
          <div aria-busy="true" aria-label="Loading schools" className={GRID_CLASSES}>
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
              title="The schools could not be loaded"
              description="The server did not answer. Check your connection, then try again."
              actionLabel="Try again"
              onAction={onRetry}
            />
          </div>
        )}

        {status === 'success' && institutions.length === 0 && (
          <div className="mt-8">
            <StateMessage
              icon={SearchX}
              title="No school matches these filters"
              description="Remove a filter or search in another city to see more schools."
              actionLabel="Clear all filters"
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
                  Show {Math.min(PAGE_SIZE, hiddenCount)} more schools
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
