import { useState } from 'react'
import { Clock, Eye, MapPin, PencilLine } from 'lucide-react'

import Button from '../ui/Button'
import { Emphasis } from '../ui/SectionHeading'
import StatusBadge from '../workspace/StatusBadge'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { navigateToSchool } from '../../routes'
import { toMediaUrl } from '../../utils/media'

// Deux habillages pour le même contenu. Sur téléphone et tablette, le texte
// est posé sur le fond clair de la page, comme sur la fiche publique. Sur
// grand écran, le bloc reprend le dégradé bleu → violet du bandeau du tableau
// de bord : texte blanc, mot d'accroche et épingle en ambre, boutons ambre et
// blanc.
const ON_PAGE_THEME = {
  section: 'bg-surface',
  title: 'text-navy',
  emphasis: '[&_em]:text-primary',
  location: 'text-ink',
  pin: 'text-primary',
  tag: 'border-line text-navy',
  orbit: 'border-line',
  mainButton: 'primary',
  secondButton: 'secondary',
}
const ON_GRADIENT_THEME = {
  section:
    'rounded-panel bg-linear-to-br from-primary via-primary-deep to-violet-deep text-white shadow-glow [--focus-ring:var(--color-accent)]',
  title: 'text-white',
  emphasis: '[&_em]:text-accent',
  location: 'text-white',
  pin: 'text-accent',
  tag: 'border-white/40 text-white',
  orbit: 'border-white/40',
  mainButton: 'accent',
  secondButton: 'inverse',
}

// Le dernier mot du nom est mis en italique, comme sur la fiche publique.
function HeroTitle({ name, theme }) {
  const words = name.trim().split(/\s+/)
  const lastWord = words.pop()

  return (
    <h2
      className={`mt-4 text-balance font-display text-3xl leading-display tracking-tight sm:text-4xl ${theme.title} ${theme.emphasis}`}
    >
      {words.join(' ')} <Emphasis>{lastWord}</Emphasis>
    </h2>
  )
}

// Sur téléphone et tablette : photo en rectangle sur toute la largeur de
// l'écran, fondue dans la couleur de la page.
function TopPhoto({ photoUrl, altText, onPhotoError }) {
  return (
    <div className="relative h-56 sm:h-72 lg:hidden">
      <img src={photoUrl} alt={altText} onError={onPhotoError} className="size-full object-cover" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-surface to-transparent"
      />
    </div>
  )
}

// Sur grand écran : photo dans la forme de galet, avec son orbite pointillée.
function SidePhoto({ photoUrl, altText, onPhotoError, orbitClass }) {
  return (
    <div className="relative mx-auto hidden aspect-5/4 w-full max-w-sm lg:block">
      <span
        aria-hidden="true"
        className={`absolute -inset-4 rounded-full border border-dashed ${orbitClass}`}
      />
      <span aria-hidden="true" className="absolute -top-5 left-1/2 size-3 rounded-full bg-violet" />
      <img
        src={photoUrl}
        alt={altText}
        onError={onPhotoError}
        className="shape-blob relative size-full object-cover shadow-raised ring-4 ring-white/20"
      />
    </div>
  )
}

function HeroActions({ detail, theme, onEditSchool }) {
  return (
    <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button
        variant={theme.mainButton}
        className="w-full sm:w-auto"
        onClick={() => onEditSchool(detail)}
      >
        <PencilLine aria-hidden="true" className="size-4" />
        Propose changes
      </Button>
      {detail.status === 'published' && (
        <Button
          variant={theme.secondButton}
          className="w-full sm:w-auto"
          onClick={() => navigateToSchool(detail.uuid)}
        >
          <Eye aria-hidden="true" className="size-4" />
          View public page
        </Button>
      )}
    </div>
  )
}

// Haut de la fiche détaillée du responsable. Sur téléphone, photo pleine
// largeur fondue dans la page ; sur grand écran, galet à droite du nom, sur
// le dégradé du tableau de bord. Sous lg, le bloc annule les marges de la page pour toucher les bords
// de l'écran.
function SchoolDetailHero({ detail, onEditSchool }) {
  // Une photo qui ne se charge pas est traitée comme une photo absente.
  const [hasPhotoFailed, setHasPhotoFailed] = useState(false)
  const coverImage = detail.media.find((mediaItem) => mediaItem.type === 'image')
  const photoProps = coverImage &&
    !hasPhotoFailed && {
      photoUrl: toMediaUrl(coverImage.url),
      altText: `${detail.name}, ${detail.city}`,
      onPhotoError: () => setHasPhotoFailed(true),
    }
  const tags = [detail.sector, detail.type, detail.linguistic_section].filter(Boolean)
  const theme = useIsDesktop() ? ON_GRADIENT_THEME : ON_PAGE_THEME

  return (
    <section className={`-mx-4 -mt-6 sm:-mx-6 lg:mx-0 lg:mt-0 ${theme.section}`}>
      {photoProps && <TopPhoto {...photoProps} />}
      <div className="grid items-center gap-12 px-4 pb-8 pt-5 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:p-10">
        <div className="min-w-0">
          <StatusBadge status={detail.status} />
          <HeroTitle name={detail.name} theme={theme} />
          <p className={`mt-4 flex items-center gap-2 text-base ${theme.location}`}>
            <MapPin aria-hidden="true" className={`size-4 shrink-0 ${theme.pin}`} />
            {[detail.city, detail.region].filter(Boolean).join(', ')}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${theme.tag}`}
              >
                {tag}
              </li>
            ))}
          </ul>
          {detail.has_pending_submission && (
            <p className="mt-4 flex items-center gap-1.5 rounded-control bg-warning-soft px-3 py-2 text-sm font-medium text-warning">
              <Clock aria-hidden="true" className="size-4 shrink-0" />
              Changes awaiting review
            </p>
          )}
          <HeroActions detail={detail} theme={theme} onEditSchool={onEditSchool} />
        </div>
        {photoProps && <SidePhoto {...photoProps} orbitClass={theme.orbit} />}
      </div>
    </section>
  )
}

export default SchoolDetailHero
