import { useState, useEffect } from 'react'
import { PALETTES, API_URL } from '../constants'
import { formatFcfa } from '../utils/format'
import {
  AlertIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  EmptySearchIcon,
  GradCapIcon,
  HeartIcon,
  MapPinIcon,
  ScaleIcon,
  SparkleIcon,
} from './icons'

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
}

function InstitutionCard({ institution, index, onView, compared, onToggleCompare }) {
  const [fav, setFav] = useState(false)
  // Frais minimum, meilleur taux et couverture arrivent dans le résumé même :
  // aucune requête supplémentaire n'est nécessaire pour afficher une carte.
  const tuition =
    institution.min_tuition != null ? Number(institution.min_tuition) : null
  const rate =
    institution.best_pass_rate != null ? Number(institution.best_pass_rate) : null
  const coverImage = institution.cover_url ? `${API_URL}${institution.cover_url}` : null
  // La photo vient du résumé ; faute de logo réel en base, le monogramme
  // dégradé tient lieu de logo sans inventer d'image. L'identité de couleur
  // se déduit désormais de l'UUID public (l'entier interne n'est plus exposé) :
  // un hachage simple suffit à rester stable pour une même école.
  const uuidHash = [...(institution.uuid ?? '')].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  )
  const palette = PALETTES[uuidHash % PALETTES.length]
  const tags = [
    capitalize(institution.sector),
    institution.type,
    institution.linguistic_section,
  ].filter(Boolean)

  return (
    <article
      className="card-in group flex flex-col overflow-hidden rounded-2xl border border-[#e7ece9] bg-white shadow-[0_4px_20px_rgba(8,18,32,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_50px_rgba(8,18,32,0.12)]"
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      {/* Couverture + badge Top (équivalent du 🏆Top, piloté par recommended) */}
      <div className="relative h-40 shrink-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})` }}
        />
        {coverImage && (
          <img
            src={coverImage}
            alt={institution.name}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {institution.recommended && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#d9a406] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
            <SparkleIcon className="h-3 w-3" />
            Top
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5">
        {/* Monogramme façon logo, chevauchant la couverture */}
        <button
          onClick={() => onView(institution.uuid)}
          aria-label={`Open ${institution.name}`}
          className="relative z-10 -mt-7 mb-3 flex h-14 w-14 items-center justify-center self-start rounded-full border-[3px] border-white bg-gradient-to-br from-[#0d7a4f] to-[#0a5e3d] text-white shadow-md transition-transform hover:scale-105"
        >
          <GradCapIcon className="h-6 w-6" />
        </button>

        <h3
          onClick={() => onView(institution.uuid)}
          className="cursor-pointer font-display text-xl leading-snug text-[#081220] transition-colors hover:text-[#0a5e3d]"
        >
          {institution.name}
        </h3>

        {/* Rangée de tags : secteur · niveau · section linguistique */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#f3f6f4] px-2.5 py-0.5 text-[11px] font-medium text-[#5b6670]"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="mt-2.5 flex items-center gap-1.5 text-sm text-[#5b6670]">
          <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
          {institution.city}
        </p>

        {/* Deux métriques réelles au rythme « note / score » du modèle inspirant */}
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#e7ece9] pt-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#98a2ac]">
              Pass rate
            </p>
            <p
              className={`mt-0.5 font-display text-2xl font-bold ${
                rate != null ? 'text-[#0d7a4f]' : 'text-[#c3cbd2]'
              }`}
            >
              {rate != null ? `${rate}%` : '—'}
            </p>
          </div>
          <div className="border-l border-[#e7ece9] pl-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#98a2ac]">
              Tuition from / year
            </p>
            <p className="mt-0.5 font-display text-lg font-bold leading-8 text-[#081220]">
              {tuition != null ? formatFcfa(tuition) : '—'}
            </p>
          </div>
        </div>

        {/* Bas de carte façon School Advisor : J'aime + Comparer à gauche,
            ouverture de la fiche à droite ; icônes volontairement réduites. */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-2 pt-5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFav((value) => !value)}
              aria-label="Save to favorites"
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                fav
                  ? 'bg-[#e5f3ec] text-[#0a5e3d]'
                  : 'bg-[#f3f6f4] text-[#5b6670] hover:bg-[#e5f3ec] hover:text-[#0a5e3d]'
              }`}
            >
              <HeartIcon className="h-3.5 w-3.5" filled={fav} />
              {fav ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={onToggleCompare}
              aria-pressed={compared}
              aria-label="Add to comparison"
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                compared
                  ? 'bg-[#fbf0d3] text-[#8a6a00]'
                  : 'bg-[#f3f6f4] text-[#5b6670] hover:bg-[#fbf0d3] hover:text-[#8a6a00]'
              }`}
            >
              <ScaleIcon className="h-3.5 w-3.5" />
              {compared ? 'Added' : 'Compare'}
            </button>
          </div>
          <button
            onClick={() => onView(institution.uuid)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0d7a4f] transition-colors hover:text-[#0a5e3d]"
          >
            View establishment
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[#dcebe3] bg-white p-6 animate-pulse">
      <div className="h-12 w-12 rounded-xl bg-[#eef1f8]" />
      <div className="mt-5 h-4 w-3/4 rounded bg-[#eef1f8]" />
      <div className="mt-2 h-4 w-1/2 rounded bg-[#eef1f8]" />
      <div className="mt-4 h-6 w-2/3 rounded-full bg-[#eef1f8]" />
      <div className="mt-5 h-4 w-full rounded bg-[#eef1f8]" />
    </div>
  )
}

function ResultsSection({
  status,
  institutions,
  hasFilters,
  appliedSearch,
  activeCity,
  activeType,
  activeLang,
  activeSector,
  activeRegion,
  minFee,
  maxFee,
  serviceNames,
  examRequirements,
  examMeta,
  onRemoveFilter,
  onReset,
  onRetry,
  onView,
  comparedIds = [],
  onToggleCompare,
}) {
  const examLabel = (examId) => {
    const exam = examMeta.find((item) => String(item.id) === String(examId))
    return exam ? exam.name : `Exam ${examId}`
  }

  const budgetLabel = () => {
    if (minFee && maxFee) return `${minFee} – ${maxFee} FCFA`
    if (minFee) return `≥ ${minFee} FCFA`
    return `≤ ${maxFee} FCFA`
  }

  const filterChip = (key, label) => (
    <button
      onClick={() => onRemoveFilter(key)}
      className="flex items-center gap-1.5 rounded-full bg-[#e5f3ec] px-3 py-1.5 text-xs font-semibold text-[#0a5e3d] transition-colors hover:bg-[#0d7a4f] hover:text-white"
    >
      {label}
      <span className="font-bold">×</span>
    </button>
  )

  // Pagination par pages de 3, avec défilement automatique en mode exploration.
  const PAGE_SIZE = 3
  const totalPages = Math.max(1, Math.ceil(institutions.length / PAGE_SIZE))
  const autoMode = !hasFilters && totalPages > 1
  const [page, setPage] = useState(0)

  // Tout changement de jeu de résultats ramène à la première page.
  useEffect(() => {
    setPage(0)
  }, [institutions])

  // Rotation seule de 6 en 6 toutes les 10 s, uniquement sans filtre actif.
  // Dès qu'un critère existe, on stoppe pour laisser l'utilisateur consulter.
  useEffect(() => {
    if (!autoMode) return
    const timer = setInterval(() => {
      setPage((current) => (current + 1) % totalPages)
    }, 10000)
    return () => clearInterval(timer)
  }, [autoMode, totalPages])

  const safePage = Math.min(page, totalPages - 1)
  // Toujours PAGE_SIZE cartes : si la fin manque d'éléments, on reprend depuis
  // le début (boucle) pour compléter la vague, jamais moins de 3 visibles.
  const startIndex = safePage * PAGE_SIZE
  const visibleInstitutions = Array.from(
    { length: Math.min(PAGE_SIZE, institutions.length) },
    (_, offset) => institutions[(startIndex + offset) % institutions.length],
  )

  return (
    <section id="results" className="scroll-mt-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0a5e3d]">
              Explore
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-[#081220] sm:text-5xl">
              {status === 'success'
                ? `${institutions.length} ${institutions.length === 1 ? 'institution' : 'institutions'} found`
                : 'Institutions'}
            </h2>
          </div>

          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {appliedSearch.trim() && (
                <button onClick={() => onRemoveFilter('q')} className="flex items-center gap-1.5 rounded-full bg-[#e5f3ec] px-3 py-1.5 text-xs font-semibold text-[#0a5e3d] transition-colors hover:bg-[#0d7a4f] hover:text-white">
                  {appliedSearch}
                  <span className="font-bold">×</span>
                </button>
              )}
              {activeCity && (
                <button onClick={() => onRemoveFilter('city')} className="flex items-center gap-1.5 rounded-full bg-[#e5f3ec] px-3 py-1.5 text-xs font-semibold text-[#0a5e3d] transition-colors hover:bg-[#0d7a4f] hover:text-white">
                  {activeCity.name}
                  <span className="font-bold">×</span>
                </button>
              )}
              {activeType && (
                <button onClick={() => onRemoveFilter('type')} className="flex items-center gap-1.5 rounded-full bg-[#e5f3ec] px-3 py-1.5 text-xs font-semibold text-[#0a5e3d] transition-colors hover:bg-[#0d7a4f] hover:text-white">
                  {activeType.name}
                  <span className="font-bold">×</span>
                </button>
              )}
              {activeLang && (
                <button onClick={() => onRemoveFilter('lang')} className="flex items-center gap-1.5 rounded-full bg-[#e5f3ec] px-3 py-1.5 text-xs font-semibold text-[#0a5e3d] transition-colors hover:bg-[#0d7a4f] hover:text-white">
                  {activeLang.name}
                  <span className="font-bold">×</span>
                </button>
              )}
              {activeSector && filterChip('sector', activeSector.label)}
              {activeRegion && filterChip('region', activeRegion.name)}
              {Boolean(minFee || maxFee) && filterChip('budget', budgetLabel())}
              {serviceNames.map((name) => (
                <button
                  key={name}
                  onClick={() => onRemoveFilter('services')}
                  className="flex items-center gap-1.5 rounded-full bg-[#e5f3ec] px-3 py-1.5 text-xs font-semibold text-[#0a5e3d] transition-colors hover:bg-[#0d7a4f] hover:text-white"
                >
                  {name}
                  <span className="font-bold">×</span>
                </button>
              ))}
              {examRequirements.map((requirement) => (
                <button
                  key={`${requirement.examId}-${requirement.minRate}`}
                  onClick={() => onRemoveFilter('exams')}
                  className="flex items-center gap-1.5 rounded-full bg-[#e5f3ec] px-3 py-1.5 text-xs font-semibold text-[#0a5e3d] transition-colors hover:bg-[#0d7a4f] hover:text-white"
                >
                  {examLabel(requirement.examId)} ≥ {requirement.minRate}%
                  <span className="font-bold">×</span>
                </button>
              ))}
              <button onClick={onReset} className="link-dotted text-sm font-semibold text-[#0d7a4f]">
                Reset filters
              </button>
            </div>
          )}
        </div>

        {status === 'loading' && (
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="mt-10 rounded-2xl border border-[#fecaca] bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#dc2626]">
              <AlertIcon />
            </div>
            <h3 className="mt-4 font-display text-2xl text-[#081220]">Something went wrong</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#4b5566]">
              We couldn't load the institutions. Make sure the API server is running
              on port 8000, then try again.
            </p>
            <button
              onClick={onRetry}
              className="mt-6 rounded-xl bg-gradient-to-r from-[#0d7a4f] to-[#0a5e3d] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(10,94,61,0.22)] transition-all hover:-translate-y-0.5 hover:from-[#0a5e3d] hover:to-[#0d7a4f]"
            >
              Try again
            </button>
          </div>
        )}

        {status === 'success' && institutions.length === 0 && (
          <div className="mt-10 rounded-2xl border border-[#dcebe3] bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e5f3ec] text-[#0d7a4f]">
              <EmptySearchIcon />
            </div>
            <h3 className="mt-4 font-display text-2xl text-[#081220]">No institutions match your criteria</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#4b5566]">
              Try removing some filters or searching in another city.
            </p>
            <button
              onClick={onReset}
              className="mt-6 rounded-xl bg-gradient-to-r from-[#0d7a4f] to-[#0a5e3d] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(10,94,61,0.22)] transition-all hover:-translate-y-0.5 hover:from-[#0a5e3d] hover:to-[#0d7a4f]"
            >
              Clear all filters
            </button>
          </div>
        )}

        {status === 'success' && institutions.length > 0 && (
          <>
            <div key={safePage} className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 wave-in">
              {visibleInstitutions.map((institution, index) => (
                <InstitutionCard
                  key={institution.uuid}
                  institution={institution}
                  index={index}
                  onView={onView}
                  compared={comparedIds.includes(institution.uuid)}
                  onToggleCompare={() => onToggleCompare(institution.uuid)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((current) => (current - 1 + totalPages) % totalPages)}
                  aria-label="Previous"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dcebe3] bg-white text-[#4b5566] transition-colors hover:border-[#0d7a4f] hover:text-[#0d7a4f]"
                >
                  <ChevronLeftIcon />
                </button>
                <span className="text-sm font-medium text-[#5b6670]">
                  {safePage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => (current + 1) % totalPages)}
                  className="flex h-10 items-center gap-2 rounded-full bg-[#0d7a4f] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(10,94,61,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#0a5e3d]"
                >
                  Show more
                  <ChevronDownIcon />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default ResultsSection