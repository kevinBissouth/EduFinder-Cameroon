import { useState } from 'react'

import Container from '../ui/Container'
import { Eyebrow } from '../ui/SectionHeading'
import { API_URL } from '../../constants'

function buildInitials(name) {
  return name
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word) && !word.endsWith('.'))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

function DirectorPortrait({ name, photoUrl }) {
  const [hasPhotoFailed, setHasPhotoFailed] = useState(false)

  if (!photoUrl || hasPhotoFailed) {
    return (
      <span
        aria-hidden="true"
        className="flex size-28 shrink-0 items-center justify-center rounded-panel bg-navy font-display text-3xl text-white"
      >
        {buildInitials(name)}
      </span>
    )
  }

  return (
    <img
      src={`${API_URL}${photoUrl}`}
      alt={name}
      onError={() => setHasPhotoFailed(true)}
      className="size-28 shrink-0 rounded-panel object-cover shadow-soft"
    />
  )
}

// La personne qui dirige l'établissement, distincte du compte qui gère la fiche.
function LeadershipSection({ institution }) {
  if (!institution.director_name) return null

  return (
    <section className="border-y border-line bg-paper py-12 sm:py-16">
      <Container className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <DirectorPortrait name={institution.director_name} photoUrl={institution.director_photo_url} />
        <div>
          <Eyebrow>Leadership</Eyebrow>
          <p className="mt-3 font-display text-2xl text-navy sm:text-3xl">{institution.director_name}</p>
          {institution.director_title && (
            <p className="mt-1 text-sm font-semibold text-ink-soft">{institution.director_title}</p>
          )}
          {institution.director_bio && (
            <p className="mt-3 max-w-[70ch] text-pretty text-base text-ink">{institution.director_bio}</p>
          )}
        </div>
      </Container>
    </section>
  )
}

export default LeadershipSection
