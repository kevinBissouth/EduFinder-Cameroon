import { useState } from 'react'
import { ArrowRight, GraduationCap, MapPin, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import AdvancedFilters from './AdvancedFilters'
import Button from './ui/Button'
import Container from './ui/Container'
import { Emphasis, Eyebrow } from './ui/SectionHeading'
import { useReferenceLabel } from '../hooks/useReferenceLabel'

const PILL_SELECT_CLASSES =
  'h-12 w-full cursor-pointer appearance-none bg-transparent text-sm font-medium text-navy outline-none'
const PILL_FIELD_CLASSES =
  'flex items-center gap-2.5 rounded-control px-4 transition-colors hover:bg-paper lg:rounded-none lg:border-l lg:border-line lg:hover:bg-transparent'

function countActiveAdvancedFilters(advancedFilters) {
  const { sectionId, sectorId, regionId, minFee, maxFee, serviceNames, examRequirements } =
    advancedFilters
  const singleCriteria = [sectionId, sectorId, regionId, minFee || maxFee].filter(Boolean)
  return singleCriteria.length + serviceNames.length + examRequirements.length
}

// Barre de recherche en pilule : un seul bloc arrondi qui réunit le texte
// libre, la ville, le type et le bouton. Sur mobile, les champs s'empilent.
// Le focus d'un champ se lit sur la pilule entière (anneau bleu), les champs
// eux-mêmes n'ont donc pas d'anneau propre.
// Le retrait à gauche de la pilule est compensé par son remplissage, pour que
// l'icône de recherche tombe exactement à l'aplomb du titre.
function SearchBar({ searchState, cities, types }) {
  const { t } = useTranslation('home')
  const translateReference = useReferenceLabel()

  return (
    <form
      onSubmit={searchState.onSubmit}
      className="grid gap-1 rounded-panel border border-line bg-surface p-2 shadow-raised transition-shadow focus-within:border-primary focus-within:ring-4 focus-within:ring-primary-soft lg:-ml-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center lg:rounded-full lg:py-1.5 lg:pl-6 lg:pr-1.5"
    >
      <label className="flex items-center gap-2.5 px-4 lg:px-0">
        <Search aria-hidden="true" className="size-4 shrink-0 text-navy" />
        <span className="sr-only">{t('hero.searchPlaceholder')}</span>
        <input
          type="search"
          value={searchState.search}
          onChange={searchState.onSearchChange}
          placeholder={t('hero.searchPlaceholder')}
          className="h-12 w-full bg-transparent text-sm font-medium text-navy outline-none placeholder:font-normal placeholder:text-ink-soft"
        />
      </label>
      <label className={PILL_FIELD_CLASSES}>
        <MapPin aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
        <span className="sr-only">{t('hero.city')}</span>
        <select value={searchState.cityId} onChange={searchState.onCityChange} className={PILL_SELECT_CLASSES}>
          <option value="">{t('hero.allCities')}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </label>
      <label className={PILL_FIELD_CLASSES}>
        <GraduationCap aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
        <span className="sr-only">{t('hero.type')}</span>
        <select value={searchState.typeId} onChange={searchState.onTypeChange} className={PILL_SELECT_CLASSES}>
          <option value="">{t('hero.allTypes')}</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {translateReference('types', type.name)}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" size="lg" className="group w-full lg:w-auto lg:rounded-full">
        {t('hero.submit')}
        <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Button>
    </form>
  )
}

// Chiffres clés sous la recherche : séparés par des filets, en chiffres serif.
// Sur téléphone les libellés restent en minuscules et sans espacement : en
// capitales espacées, « Établissements » ne tient pas à côté des deux autres.
function KeyCounters({ figures }) {
  const { t } = useTranslation('home')
  const counters = [
    { value: `${figures.schoolCount}+`, label: t('hero.counters.schools') },
    { value: figures.cityCount, label: t('hero.counters.cities') },
    { value: figures.regionCount, label: t('hero.counters.regions') },
  ]

  return (
    <dl className="mt-8 flex divide-x divide-line border-t border-line pt-6">
      {counters.map((counter) => (
        <div key={counter.label} className="px-4 first:pl-0 sm:px-6">
          <dd className="font-display text-3xl tabular-nums text-navy">{counter.value}</dd>
          <dt className="mt-1 text-xs font-semibold text-ink-soft sm:uppercase sm:tracking-eyebrow">
            {counter.label}
          </dt>
        </div>
      ))}
    </dl>
  )
}

// La photo est rognée en arche, avec deux arcs fins derrière elle : c'est ce
// qui remplace une photo détourée, que le projet ne possède pas.
function HeroPhoto() {
  const { t } = useTranslation('home')
  const [hasPhotoFailed, setHasPhotoFailed] = useState(false)

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <span
        aria-hidden="true"
        className="absolute -inset-x-6 -top-6 bottom-0 rounded-t-full border border-b-0 border-line"
      />
      <span
        aria-hidden="true"
        className="absolute -inset-x-12 -top-12 bottom-0 rounded-t-full border border-b-0 border-primary-soft"
      />
      {hasPhotoFailed ? (
        <div className="relative flex aspect-4/5 items-center justify-center rounded-t-full rounded-b-panel bg-muted text-primary">
          <GraduationCap aria-hidden="true" className="size-16" />
        </div>
      ) : (
        <img
          src="/hero-family6.jpeg"
          alt={t('hero.photoAlt')}
          onError={() => setHasPhotoFailed(true)}
          className="relative aspect-4/5 w-full rounded-t-full rounded-b-panel object-cover shadow-raised"
        />
      )}
    </div>
  )
}

function Hero({ searchState, cities, types, advancedFilters, figures }) {
  const { t } = useTranslation('home')
  const [areAdvancedFiltersOpen, setAreAdvancedFiltersOpen] = useState(false)
  const activeAdvancedFilterCount = countActiveAdvancedFilters(advancedFilters)

  return (
    <section id="search" className="scroll-mt-20 bg-surface">
      <Container className="grid grid-cols-1 items-center gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-20 lg:py-24">
        <div className="animate-settle">
          <Eyebrow>{t('hero.eyebrow')}</Eyebrow>
          <h1 className="mt-5 text-balance font-display text-4xl leading-display tracking-tight text-navy sm:text-5xl xl:text-6xl">
            <Trans t={t} i18nKey="hero.title" components={{ emphasis: <Emphasis /> }} />
          </h1>
          <span aria-hidden="true" className="mt-6 block h-0.5 w-10 rounded-full bg-primary" />
          <p className="mt-6 max-w-[52ch] text-pretty text-base text-ink sm:text-lg">
            {figures.schoolCount > 0
              ? t('hero.leadWithCount', { schoolCount: figures.schoolCount })
              : t('hero.lead')}
          </p>

          <div className="mt-8">
            <SearchBar searchState={searchState} cities={cities} types={types} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
            <button
              type="button"
              aria-expanded={areAdvancedFiltersOpen}
              aria-controls="advanced-filters"
              onClick={() => setAreAdvancedFiltersOpen(!areAdvancedFiltersOpen)}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-control text-sm font-semibold text-primary-deep transition-colors hover:text-primary"
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              {areAdvancedFiltersOpen ? t('hero.hideFilters') : t('hero.showFilters')}
              {activeAdvancedFilterCount > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                  {activeAdvancedFilterCount}
                  <span className="sr-only"> {t('hero.activeFilters')}</span>
                </span>
              )}
            </button>
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-primary-deep" />
              {t('hero.independence')}
            </p>
          </div>

          {areAdvancedFiltersOpen && (
            <div
              id="advanced-filters"
              className="mt-3 rounded-panel border border-line bg-paper p-4 sm:p-5"
            >
              <AdvancedFilters advancedFilters={advancedFilters} />
            </div>
          )}

          <KeyCounters figures={figures} />
        </div>

        <div className="hidden lg:block">
          <HeroPhoto />
        </div>
      </Container>
    </section>
  )
}

export default Hero
