import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import ContactCard from './ContactCard'
import Container from '../ui/Container'
import SectionHeading, { Emphasis } from '../ui/SectionHeading'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'

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

// Repères chiffrés de la fiche, sans répéter la barre de faits clés.
function listLandmarks(institution, t, translateReference) {
  const photoCount = (institution.media ?? []).filter((media) => media.type === 'image').length
  return [
    {
      label: t('overview.location'),
      value: [institution.city, translateReference('regions', institution.region)]
        .filter(Boolean)
        .join(', '),
    },
    { label: t('overview.programsOffered'), value: institution.programs?.length || null },
    { label: t('overview.servicesOnSite'), value: institution.services?.length || null },
    {
      label: t('overview.examSessions'),
      value: countDistinct((institution.exam_results ?? []).map((result) => result.session)) || null,
    },
    { label: t('overview.photos'), value: photoCount || null },
  ].filter((landmark) => landmark.value)
}

function OverviewSection({ institution }) {
  const { t } = useTranslation('profile')
  const translateReference = useReferenceLabel()

  return (
    <section id="overview" className="scroll-mt-36 bg-surface py-16 sm:py-20">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] lg:gap-12">
        <div>
          <SectionHeading
            size="md"
            eyebrow={t('overview.eyebrow')}
            title={<Trans t={t} i18nKey="overview.title" components={{ emphasis: <Emphasis /> }} />}
          />
          {institution.description ? (
            <Description description={institution.description} />
          ) : (
            <p className="mt-5 text-base text-ink-soft">
              {t('overview.noDescription')}
            </p>
          )}
        </div>

        <dl className="divide-y divide-line border-y border-line self-start">
          {listLandmarks(institution, t, translateReference).map((landmark) => (
            <div key={landmark.label} className="py-4">
              <dt className="text-xs text-ink-soft">{landmark.label}</dt>
              <dd className="mt-0.5 text-sm font-bold tabular-nums text-navy">{landmark.value}</dd>
            </div>
          ))}
        </dl>

        <div className="self-start">
          <ContactCard institution={institution} />
        </div>
      </Container>
    </section>
  )
}

export default OverviewSection
