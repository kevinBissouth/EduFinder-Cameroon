import { useState } from 'react'
import {
  ArrowRight,
  ChevronDown,
  GraduationCap,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import AdvancedFilters from './AdvancedFilters'
import ChoiceDialog from './filters/ChoiceDialog'
import { findSelectedName } from './filters/choiceLabels'
import Button from './ui/Button'
import Container from './ui/Container'
import { Emphasis, Eyebrow } from './ui/SectionHeading'
import { translateOptionNames, useReferenceLabel } from '../hooks/useReferenceLabel'

const PILL_FIELD_CLASSES =
  'flex h-12 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-control px-4 text-left text-sm font-medium text-navy transition-colors hover:bg-paper xl:rounded-none xl:border-l xl:border-line xl:px-3 xl:hover:bg-transparent'

// Un critère de la barre de recherche (ville, type) : un bouton qui dit la
// valeur en cours. Il ouvre la même fenêtre de choix que les filtres avancés,
// à la place de la liste déroulante du navigateur.
function PillChoice({ icon: Icon, label, value, onOpen }) {
  return (
    <button type="button" aria-haspopup="dialog" onClick={onOpen} className={PILL_FIELD_CLASSES}>
      <Icon aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
      <span className="sr-only">{label} : </span>
      <span className="min-w-0 flex-1 truncate">{value}</span>
      {/* Dans la pilule du grand écran, la place manque : la flèche cède la
          sienne au texte. */}
      <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-ink-soft xl:hidden" />
    </button>
  )
}

function countActiveAdvancedFilters(advancedFilters) {
  const { sectionId, sectorId, regionId, minFee, maxFee, serviceNames, examRequirements } =
    advancedFilters
  const singleCriteria = [sectionId, sectorId, regionId, minFee || maxFee].filter(Boolean)
  return singleCriteria.length + serviceNames.length + examRequirements.length
}

// Barre de recherche en pilule : un seul bloc arrondi qui réunit le texte
// libre, la ville, le type et le bouton. Sous 1280 px les champs s'empilent :
// à côté de la photo, la ligne est trop étroite pour « Toutes les villes ».
// Le focus d'un champ se lit sur la pilule entière (anneau bleu), les champs
// eux-mêmes n'ont donc pas d'anneau propre.
// Le retrait à gauche de la pilule est compensé par son remplissage, pour que
// l'icône de recherche tombe exactement à l'aplomb du titre.
function SearchBar({ searchState, cities, types }) {
  const { t } = useTranslation('home')
  const translateReference = useReferenceLabel()
  const [openChoiceId, setOpenChoiceId] = useState(null)
  const choices = [
    {
      id: 'city',
      icon: MapPin,
      label: t('hero.city'),
      description: t('hero.cityHint'),
      anyLabel: t('hero.allCities'),
      options: cities,
      selectedId: searchState.cityId,
      onSelect: searchState.onCityChange,
    },
    {
      id: 'type',
      icon: GraduationCap,
      label: t('hero.type'),
      description: t('hero.typeHint'),
      anyLabel: t('hero.allTypes'),
      options: translateOptionNames(types, 'types', translateReference),
      selectedId: searchState.typeId,
      onSelect: searchState.onTypeChange,
    },
  ]
  const openChoice = choices.find((choice) => choice.id === openChoiceId)

  return (
    <>
      <form
        onSubmit={searchState.onSubmit}
        className="grid gap-1 rounded-panel border border-line bg-surface p-2 shadow-raised transition-shadow focus-within:border-primary focus-within:ring-4 focus-within:ring-primary-soft xl:-ml-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-center xl:rounded-full xl:py-1.5 xl:pl-6 xl:pr-1.5"
      >
        <label className="flex items-center gap-2.5 px-4 xl:px-0">
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
        {choices.map((choice) => (
          <PillChoice
            key={choice.id}
            icon={choice.icon}
            label={choice.label}
            value={findSelectedName(choice)}
            onOpen={() => setOpenChoiceId(choice.id)}
          />
        ))}
        <Button type="submit" size="lg" className="group w-full xl:w-auto xl:rounded-full">
          {t('hero.submit')}
          <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </form>
      {openChoice && (
        <ChoiceDialog
          icon={openChoice.icon}
          title={openChoice.label}
          description={openChoice.description}
          anyLabel={openChoice.anyLabel}
          options={openChoice.options}
          selectedId={openChoice.selectedId}
          onSelect={openChoice.onSelect}
          onClose={() => setOpenChoiceId(null)}
        />
      )}
    </>
  )
}

// Chiffres clés sous la recherche : séparés par des filets, en chiffres serif.
// Trois colonnes égales, centrées : alignés à gauche, ils laissaient la moitié
// droite de la ligne vide.
// Sur téléphone les libellés restent en minuscules et sans espacement : en
// capitales espacées, « Établissements » ne tient pas à côté des deux autres.
function KeyCounters({ figures }) {
  const { t } = useTranslation('home')
  const counters = [
    { value: figures.schoolCount, label: t('hero.counters.schools') },
    { value: figures.cityCount, label: t('hero.counters.cities') },
    { value: figures.regionCount, label: t('hero.counters.regions') },
  ]

  return (
    <dl className="mt-8 grid grid-cols-3 divide-x divide-line border-t border-line pt-6 text-center">
      {counters.map((counter) => (
        <div key={counter.label} className="px-1 sm:px-6">
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
    <div className="relative mx-auto w-full max-w-sm animate-photo-reveal">
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
        {/* Chaque élément se pose à son tour, à 70 ms d'intervalle : l'œil
            suit l'ordre de lecture, du titre jusqu'aux chiffres. */}
        <div>
          <div className="animate-settle">
            <Eyebrow>{t('hero.eyebrow')}</Eyebrow>
          </div>
          <h1 className="mt-5 animate-settle text-balance [animation-delay:70ms] font-display text-4xl leading-display tracking-tight text-navy sm:text-5xl xl:text-6xl">
            <Trans t={t} i18nKey="hero.title" components={{ emphasis: <Emphasis /> }} />
          </h1>
          <span
            aria-hidden="true"
            className="mt-6 block h-0.5 w-10 animate-settle rounded-full bg-primary [animation-delay:140ms]"
          />
          <p className="mt-6 max-w-[52ch] animate-settle text-pretty text-base text-ink [animation-delay:140ms] sm:text-lg">
            {figures.schoolCount > 0
              ? t('hero.leadWithCount', { schoolCount: figures.schoolCount })
              : t('hero.lead')}
          </p>

          <div className="mt-8 animate-settle [animation-delay:210ms]">
            <SearchBar searchState={searchState} cities={cities} types={types} />
          </div>

          <div className="mt-4 flex animate-settle flex-wrap items-center justify-between gap-x-6 gap-y-1 [animation-delay:280ms]">
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
              className="mt-3 animate-menu-drop rounded-panel border border-line bg-linear-to-br from-primary-soft/60 via-paper to-paper p-4 shadow-soft sm:p-5"
            >
              <AdvancedFilters advancedFilters={advancedFilters} />
              {/* Les filtres s'appliquent dès qu'on les change : ce bouton le
                  dit, et mène aux résultats sans avoir à remonter. */}
              <div className="mt-4 flex justify-end">
                <Button as="a" href="/#results" className="w-full sm:w-auto">
                  {t('hero.viewResults', { count: figures.resultCount })}
                </Button>
              </div>
            </div>
          )}

          <div className="animate-settle [animation-delay:350ms]">
            <KeyCounters figures={figures} />
          </div>
        </div>

        <div className="hidden lg:block">
          <HeroPhoto />
        </div>
      </Container>
    </section>
  )
}

export default Hero
