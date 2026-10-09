import { useState } from 'react'
import { ArrowRight, BadgeCheck, GraduationCap, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { API_URL } from '../constants'
import { formatFcfa, formatPercent } from '../utils/format'
import { CompareToggle, SaveToggle } from './compare/SchoolToggles'
import { useReferenceLabel } from '../hooks/useReferenceLabel'

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

// La ville est posée sur la photo, sur un voile sombre qui garantit sa
// lisibilité quelle que soit l'image.
function CardCover({ institution }) {
  const { t } = useTranslation('home')
  const [hasImageFailed, setHasImageFailed] = useState(false)
  const hasCoverImage = institution.cover_url && !hasImageFailed

  return (
    <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden bg-navy text-white/40">
      {hasCoverImage ? (
        <img
          src={`${API_URL}${institution.cover_url}`}
          alt=""
          loading="lazy"
          onError={() => setHasImageFailed(true)}
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <GraduationCap aria-hidden="true" className="size-12" />
      )}
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-navy to-transparent" />
      <p className="absolute bottom-3 left-4 flex items-center gap-1.5 text-sm font-semibold text-white">
        <MapPin aria-hidden="true" className="size-4 shrink-0" />
        {institution.city}
      </p>
      {/* Une coche sur fond neutre, pas une étoile : le badge constate que la
          fiche est renseignée, il ne note pas l'établissement. */}
      {institution.is_profile_complete && (
        <span
          title={t('card.completeProfileHint')}
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-bold text-primary-deep shadow-soft"
        >
          <BadgeCheck aria-hidden="true" className="size-3.5" />
          {t('card.completeProfile')}
        </span>
      )}
    </div>
  )
}

// Les deux chiffres qu'un parent compare d'abord, côte à côte.
function KeyFigures({ institution }) {
  const { t } = useTranslation(['home', 'common'])
  const figures = [
    {
      label: t('card.bestPassRate'),
      value: institution.best_pass_rate != null ? formatPercent(institution.best_pass_rate) : null,
      valueClasses: 'text-primary',
    },
    {
      label: t('card.feesFrom'),
      value: institution.min_tuition != null ? formatFcfa(institution.min_tuition) : null,
      valueClasses: 'text-navy',
    },
  ]

  return (
    <dl className="grid grid-cols-2 divide-x divide-line border-y border-line py-4">
      {figures.map((figure) => (
        <div key={figure.label} className="first:pr-4 last:pl-4">
          <dt className="text-xs text-ink-soft">{figure.label}</dt>
          <dd
            className={
              figure.value
                ? `mt-1 font-display text-2xl leading-8 tabular-nums ${figure.valueClasses}`
                : 'mt-1 text-sm leading-8 text-ink-soft'
            }
          >
            {figure.value ?? t('common:notPublished')}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function InstitutionCard({ institution, onView }) {
  const { t } = useTranslation('home')
  const translateReference = useReferenceLabel()
  const categories = [
    capitalize(translateReference('sectors', institution.sector)),
    translateReference('types', institution.type),
    translateReference('sections', institution.linguistic_section),
  ]
    .filter(Boolean)
    .join(' · ')
  const openProfile = () => onView(institution.uuid)

  return (
    <article className="group flex flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-raised">
      <CardCover institution={institution} />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-balance text-xs font-semibold uppercase tracking-eyebrow text-primary-deep">
          {categories}
        </p>
        <h3 className="mb-5 font-display text-2xl leading-tight text-navy">
          <button
            type="button"
            onClick={openProfile}
            className="flex min-h-11 cursor-pointer items-center rounded-control text-left text-balance transition-colors hover:text-primary"
          >
            {institution.name}
          </button>
        </h3>

        <div className="mt-auto">
          <KeyFigures institution={institution} />

          {/* Sur téléphone, « Comparer » et « Voir la fiche » s'empilent sur
              toute la largeur et le cœur se cale à droite, à mi-hauteur des
              deux. À partir de la tablette, tout tient sur une ligne. */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 pt-5 sm:flex sm:gap-2">
            <CompareToggle schoolId={institution.uuid} className="max-sm:w-full" />
            <SaveToggle schoolId={institution.uuid} className="max-sm:row-span-2" />
            <button
              type="button"
              onClick={openProfile}
              aria-label={t('card.viewNamed', { name: institution.name })}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-semibold text-primary-deep transition-colors hover:text-primary max-sm:bg-primary-soft max-sm:px-4 sm:ml-auto sm:px-1"
            >
              {t('card.view')}
              <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default InstitutionCard
