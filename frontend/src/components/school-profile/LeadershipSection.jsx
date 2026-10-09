import { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Container from '../ui/Container'
import { Emphasis, Eyebrow } from '../ui/SectionHeading'
import { splitLastWord } from './helpers'
import { API_URL } from '../../constants'

function buildInitials(name) {
  return name
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word) && !word.endsWith('.'))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

const PORTRAIT_CLASSES = 'shape-blob relative size-full shadow-raised'

function DirectorPortrait({ name, photoUrl }) {
  const [hasPhotoFailed, setHasPhotoFailed] = useState(false)

  if (!photoUrl || hasPhotoFailed) {
    return (
      <span
        aria-hidden="true"
        className={`flex items-center justify-center bg-linear-to-br from-primary to-violet-deep font-display text-6xl text-white ${PORTRAIT_CLASSES}`}
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
      className={`object-cover ${PORTRAIT_CLASSES}`}
    />
  )
}

// Même langage que la photo du haut de la fiche : un galet, une orbite
// pointillée et ses deux points. Un halo clair le détache du fond, et une
// pastille dit le rôle de la personne. Sans photo, les initiales prennent la
// place du portrait, dans la même forme.
function PortraitFrame({ name, photoUrl }) {
  return (
    <div className="relative mx-auto size-48 shrink-0 sm:size-56 lg:size-64">
      <span aria-hidden="true" className="absolute -inset-8 rounded-full bg-primary-soft blur-2xl" />
      <span aria-hidden="true" className="absolute -inset-4 rounded-full border border-dashed border-primary/40" />
      <span aria-hidden="true" className="absolute -top-5 left-1/3 size-3 rounded-full bg-accent" />
      <span aria-hidden="true" className="absolute -bottom-4 right-1/4 size-3 rounded-full bg-violet" />
      <DirectorPortrait name={name} photoUrl={photoUrl} />
      <span
        aria-hidden="true"
        className="absolute -bottom-1 -right-1 flex size-12 items-center justify-center rounded-full bg-linear-to-br from-primary to-violet-deep text-white shadow-glow ring-4 ring-surface"
      >
        <GraduationCap className="size-5" />
      </span>
    </div>
  )
}

// La personne qui dirige l'établissement, distincte du compte qui gère la
// fiche. Portrait au-dessus du texte centré sur téléphone, à sa gauche
// au-delà. Sans fonction ou sans biographie, ces blocs disparaissent et le
// nom tient seul à côté du portrait.
function LeadershipSection({ institution }) {
  const { t } = useTranslation('profile')
  if (!institution.director_name) return null
  const { leadingWords, lastWord } = splitLastWord(institution.director_name)

  return (
    <section className="overflow-hidden border-y border-line bg-surface py-14 sm:py-20">
      <Container className="flex flex-col items-center gap-10 sm:flex-row sm:gap-14 lg:gap-20">
        <PortraitFrame name={institution.director_name} photoUrl={institution.director_photo_url} />
        <div className="flex min-w-0 flex-col items-center text-center sm:items-start sm:text-left">
          <Eyebrow>{t('leadership.eyebrow')}</Eyebrow>
          <p className="mt-4 text-balance font-display text-4xl leading-display tracking-tight text-navy sm:text-5xl">
            {leadingWords} <Emphasis>{lastWord}</Emphasis>
          </p>
          {institution.director_title && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-1.5 text-sm font-semibold text-navy">
              <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
              {institution.director_title}
            </p>
          )}
          {institution.director_bio && (
            <p className="mt-6 max-w-[60ch] rounded-panel border-l-4 border-primary bg-linear-to-r from-primary-soft/60 to-transparent px-5 py-4 text-left text-pretty text-base text-ink sm:text-lg">
              {institution.director_bio}
            </p>
          )}
        </div>
      </Container>
    </section>
  )
}

export default LeadershipSection
