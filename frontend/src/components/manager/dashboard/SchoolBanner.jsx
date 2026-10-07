import { useState } from 'react'
import { ChevronRight, Eye, PencilLine } from 'lucide-react'

import Button from '../../ui/Button'
import StatusBadge from '../../workspace/StatusBadge'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { navigateToSchool } from '../../../routes'
import { toMediaUrl } from '../../../utils/media'

// Même seuil que le point de rupture sm de Tailwind.
const FROM_TABLET_QUERY = '(min-width: 640px)'

// Sur téléphone et tablette : la photo en rectangle sur toute la largeur de
// la carte, fondue dans la couleur de départ du dégradé.
function TopPhoto({ photoUrl, altText, onPhotoError }) {
  return (
    <div className="relative h-40 sm:h-52 lg:hidden">
      <img src={photoUrl} alt={altText} onError={onPhotoError} className="size-full object-cover" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-primary-deep to-transparent"
      />
    </div>
  )
}

// Sur grand écran : la photo dans la forme de galet de la fiche publique.
function SidePhoto({ photoUrl, altText, onPhotoError }) {
  return (
    <img
      src={photoUrl}
      alt={altText}
      onError={onPhotoError}
      className="shape-blob hidden aspect-5/4 w-72 shrink-0 object-cover shadow-raised ring-4 ring-white/20 lg:block"
    />
  )
}

function BannerActions({ detail, onEditSchool, onOpenSchool }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <Button variant="accent" onClick={() => onEditSchool(detail)}>
        <PencilLine aria-hidden="true" className="size-4" />
        Propose changes
      </Button>
      <Button variant="inverse" onClick={() => onOpenSchool(detail.uuid)}>
        Open school details
      </Button>
      {detail.status === 'published' && (
        <button
          type="button"
          onClick={() => navigateToSchool(detail.uuid)}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-button px-4 text-sm font-semibold text-white hover:bg-white/10"
        >
          <Eye aria-hidden="true" className="size-4" />
          View public page
        </button>
      )}
    </div>
  )
}

// Bandeau du tableau de bord : l'établissement piloté, sa photo, son état et
// les actions principales, sur le dégradé bleu → violet. La photo suit la
// disposition de la fiche publique : rectangle en haut de la carte sur
// téléphone, galet à droite sur grand écran. Sous lg, le dégradé va d'un seul
// trait du plus foncé (en haut) au plus clair (en bas). Sur téléphone, la
// carte n'a plus de boutons : elle est elle-même le bouton qui ouvre la fiche
// détaillée, où se trouvent les autres actions.
function SchoolBanner({ detail, onEditSchool, onOpenSchool }) {
  const isPhone = !useMediaQuery(FROM_TABLET_QUERY)
  // Une photo qui ne se charge pas est traitée comme une photo absente.
  const [hasPhotoFailed, setHasPhotoFailed] = useState(false)
  const coverImage = detail.media.find((mediaItem) => mediaItem.type === 'image')
  const photoProps = coverImage &&
    !hasPhotoFailed && {
      photoUrl: toMediaUrl(coverImage.url),
      altText: `${detail.name}, ${detail.city}`,
      onPhotoError: () => setHasPhotoFailed(true),
    }

  return (
    <section className="relative overflow-hidden rounded-panel bg-linear-to-b from-primary-deep to-violet-deep text-white shadow-glow [--focus-ring:var(--color-accent)] lg:bg-linear-to-br lg:from-primary lg:via-primary-deep lg:to-violet-deep">
      {photoProps && <TopPhoto {...photoProps} />}
      <div className="flex items-center justify-between gap-8 p-6 sm:p-8">
        <div className="min-w-0">
          <StatusBadge status={detail.status} />
          <h2 className="mt-3 font-display text-2xl leading-display text-balance sm:text-3xl">
            {isPhone ? (
              // Le bouton s'étend à toute la carte : un appui n'importe où
              // dessus ouvre la fiche détaillée.
              <button
                type="button"
                onClick={() => onOpenSchool(detail.uuid)}
                className="cursor-pointer text-left after:absolute after:inset-0"
              >
                {detail.name}
                <span className="sr-only">, open school details</span>
              </button>
            ) : (
              detail.name
            )}
          </h2>
          <p className="mt-2 text-sm text-white text-pretty">
            {[detail.city, detail.region, detail.type, detail.sector].filter(Boolean).join(', ')}
          </p>
          {isPhone ? (
            <p aria-hidden="true" className="mt-4 flex items-center gap-1 text-sm font-semibold">
              Open school details
              <ChevronRight className="size-4" />
            </p>
          ) : (
            <BannerActions detail={detail} onEditSchool={onEditSchool} onOpenSchool={onOpenSchool} />
          )}
        </div>
        {photoProps && <SidePhoto {...photoProps} />}
      </div>
    </section>
  )
}

export default SchoolBanner
