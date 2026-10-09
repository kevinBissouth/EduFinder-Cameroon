import { useState } from 'react'
import { BookOpen, ClipboardCheck, ConciergeBell, Images, MapPin } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import Container from '../ui/Container'
import SectionHeading, { Emphasis } from '../ui/SectionHeading'
import WrittenInNotice from './WrittenInNotice'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import { useSchoolText } from '../../hooks/useSchoolText'

// Au-delà de cette longueur, la description est repliée derrière « Read more ».
const LONG_DESCRIPTION_LENGTH = 420

function Description({ description }) {
  const { t } = useTranslation('profile')
  const [isExpanded, setIsExpanded] = useState(false)
  const isLong = description.length > LONG_DESCRIPTION_LENGTH

  return (
    <>
      <p
        className={`mt-5 whitespace-pre-line text-pretty text-base text-ink ${
          isLong && !isExpanded ? 'line-clamp-6' : ''
        }`}
      >
        {description}
      </p>
      {isLong && (
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 inline-flex h-11 cursor-pointer items-center rounded-control text-sm font-semibold text-primary-deep transition-colors hover:text-primary"
        >
          {isExpanded ? t('overview.showLess') : t('overview.readMore')}
        </button>
      )}
    </>
  )
}

function countDistinct(values) {
  return new Set(values).size
}

// Compteurs de la fiche, sans répéter la barre de faits clés. Un compteur à
// zéro n'est pas affiché.
function listCounters(institution, t) {
  const photoCount = (institution.media ?? []).filter((media) => media.type === 'image').length
  return [
    { icon: BookOpen, label: t('overview.programsOffered'), value: institution.programs?.length },
    { icon: ConciergeBell, label: t('overview.servicesOnSite'), value: institution.services?.length },
    {
      icon: ClipboardCheck,
      label: t('overview.examSessions'),
      value: countDistinct((institution.exam_results ?? []).map((result) => result.session)),
    },
    { icon: Images, label: t('overview.photos'), value: photoCount },
  ].filter((counter) => counter.value)
}

// Sous 1024 px chaque repère est une tuile ; au-delà c'est une ligne de la
// liste d'origine, d'où le préfixe max-lg sur tout l'habillage de tuile.
const TILE_CLASSES =
  'max-lg:rounded-panel max-lg:border max-lg:border-line max-lg:bg-linear-to-br max-lg:from-primary-soft/50 max-lg:to-surface max-lg:p-4 max-lg:shadow-soft lg:py-4'

function LocationLandmark({ location }) {
  const { t } = useTranslation('profile')

  return (
    <div className={`col-span-2 flex items-center gap-3 ${TILE_CLASSES}`}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-linear-to-br from-primary to-violet-deep text-white shadow-glow lg:hidden">
        <MapPin aria-hidden="true" className="size-5" />
      </span>
      <div>
        <dt className="text-xs text-ink-soft">{t('overview.location')}</dt>
        <dd className="mt-0.5 text-sm font-bold text-navy">{location}</dd>
      </div>
    </div>
  )
}

// Sur téléphone le chiffre passe au-dessus de son libellé, en grand, avec
// l'icône du repère dans le coin.
function CounterLandmark({ counter, isFullWidth }) {
  return (
    <div className={`relative flex flex-col max-lg:flex-col-reverse ${TILE_CLASSES} ${isFullWidth ? 'col-span-2' : ''}`}>
      <counter.icon
        aria-hidden="true"
        className="absolute right-4 top-4 size-5 text-primary lg:hidden"
        strokeWidth={1.5}
      />
      <dt className="text-xs text-ink-soft max-lg:mt-1">{counter.label}</dt>
      <dd className="text-sm font-bold tabular-nums text-navy max-lg:font-display max-lg:text-4xl max-lg:font-normal max-lg:text-primary-deep lg:mt-0.5">
        {counter.value}
      </dd>
    </div>
  )
}

// Repères de la fiche. Sur téléphone : l'adresse en bandeau, puis les
// compteurs en tuiles sur deux colonnes ; avec un nombre impair de compteurs,
// le dernier prend toute la largeur, la grille ne laisse jamais de case vide.
// Sur grand écran : une liste, dans la colonne à côté de la présentation.
function Landmarks({ institution }) {
  const { t } = useTranslation('profile')
  const translateReference = useReferenceLabel()
  const location = [institution.city, translateReference('regions', institution.region)]
    .filter(Boolean)
    .join(', ')
  const counters = listCounters(institution, t)
  const hasOddCounters = counters.length % 2 === 1

  return (
    <dl className="grid grid-cols-2 gap-3 self-start lg:block lg:divide-y lg:divide-line lg:border-y lg:border-line">
      {location && <LocationLandmark location={location} />}
      {counters.map((counter, counterIndex) => (
        <CounterLandmark
          key={counter.label}
          counter={counter}
          isFullWidth={hasOddCounters && counterIndex === counters.length - 1}
        />
      ))}
    </dl>
  )
}

function OverviewSection({ institution }) {
  const { t } = useTranslation('profile')
  const description = useSchoolText(institution)('description')

  return (
    <section id="overview" className="scroll-mt-36 bg-surface py-16 sm:py-20">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <SectionHeading
            size="md"
            eyebrow={t('overview.eyebrow')}
            title={<Trans t={t} i18nKey="overview.title" components={{ emphasis: <Emphasis /> }} />}
          />
          {description.text ? (
            <>
              <Description description={description.text} />
              <WrittenInNotice languageCode={description.writtenIn} className="mt-3" />
            </>
          ) : (
            <p className="mt-5 text-base text-ink-soft">
              {t('overview.noDescription')}
            </p>
          )}
        </div>

        <Landmarks institution={institution} />
      </Container>
    </section>
  )
}

export default OverviewSection
