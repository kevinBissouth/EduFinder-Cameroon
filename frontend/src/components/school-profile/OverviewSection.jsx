import { useState } from 'react'

import ContactCard from './ContactCard'
import Container from '../ui/Container'
import SectionHeading, { Emphasis } from '../ui/SectionHeading'

// Au-delà de cette longueur, la description est repliée derrière « Read more ».
const LONG_DESCRIPTION_LENGTH = 420

function Description({ description }) {
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
          {isExpanded ? 'Show less' : 'Read the full presentation'}
        </button>
      )}
    </>
  )
}

function countDistinct(values) {
  return new Set(values).size
}

// Repères chiffrés de la fiche, sans répéter la barre de faits clés.
function listLandmarks(institution) {
  const photoCount = (institution.media ?? []).filter((media) => media.type === 'image').length
  return [
    { label: 'Location', value: [institution.city, institution.region].filter(Boolean).join(', ') },
    { label: 'Programs offered', value: institution.programs?.length || null },
    { label: 'Services on site', value: institution.services?.length || null },
    {
      label: 'Exam sessions published',
      value: countDistinct((institution.exam_results ?? []).map((result) => result.session)) || null,
    },
    { label: 'Photos', value: photoCount || null },
  ].filter((landmark) => landmark.value)
}

function OverviewSection({ institution }) {
  return (
    <section id="overview" className="scroll-mt-36 bg-surface py-16 sm:py-20">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] lg:gap-12">
        <div>
          <SectionHeading
            size="md"
            eyebrow="At a glance"
            title={
              <>
                What to know <Emphasis>before</Emphasis> you visit.
              </>
            }
          />
          {institution.description ? (
            <Description description={institution.description} />
          ) : (
            <p className="mt-5 text-base text-ink-soft">
              This school has not published a presentation yet.
            </p>
          )}
        </div>

        <dl className="divide-y divide-line border-y border-line self-start">
          {listLandmarks(institution).map((landmark) => (
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
