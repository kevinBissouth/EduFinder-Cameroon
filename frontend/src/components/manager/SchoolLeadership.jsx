import { useState } from 'react'
import { Upload, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import ClampedText from '../workspace/ClampedText'
import FileButton from '../workspace/FileButton'
import { useHeadTitle } from '../../hooks/useHeadTitle'
import { useReviewRequest } from '../../hooks/useModificationProposal'
import { toMediaUrl } from '../../utils/media'

const IMAGE_FILE_TYPES = 'image/*'
const PORTRAIT_CLASSES =
  'size-24 shrink-0 rounded-full border-4 border-surface shadow-raised sm:size-28'

function PortraitPlaceholder() {
  return (
    <span className={`${PORTRAIT_CLASSES} flex items-center justify-center bg-violet-soft text-violet-deep`}>
      <UserRound aria-hidden="true" className="size-10" />
    </span>
  )
}

// Une photo introuvable laisserait son texte alternatif déborder du cercle :
// je retombe alors sur l'icône, comme quand il n'y a pas de photo.
function DirectorPortrait({ photoUrl, directorName }) {
  const { t } = useTranslation('manager')
  const [hasPhotoFailed, setHasPhotoFailed] = useState(false)
  if (!photoUrl || hasPhotoFailed) return <PortraitPlaceholder />

  return (
    <img
      src={toMediaUrl(photoUrl)}
      alt={
        directorName
          ? t('leadership.portraitAlt', { name: directorName })
          : t('leadership.portraitAltUnknown')
      }
      onError={() => setHasPhotoFailed(true)}
      className={`${PORTRAIT_CLASSES} bg-muted object-cover`}
    />
  )
}

// Responsable de l'établissement (directeur, proviseur…), distinct du compte
// qui gère la fiche, présenté comme une carte de visite : un bandeau en
// dégradé, le portrait à cheval dessus, puis le nom, le titre et la
// biographie. Sa photo passe par une soumission, comme la galerie.
function SchoolLeadership({ detail, onProposalSubmitted }) {
  const { t } = useTranslation('manager')
  const reviewRequest = useReviewRequest(onProposalSubmitted)
  const hasDirectorDetails = detail.director_name || detail.director_title || detail.director_bio
  const directorTitle = useHeadTitle()(detail).text

  const proposePhoto = (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return reviewRequest.sendForReview(
      'put',
      `/my/establishments/${detail.uuid}/director-photo`,
      formData,
    )
  }

  return (
    <div className="overflow-hidden rounded-control border border-line">
      <div aria-hidden="true" className="h-20 bg-linear-to-br from-primary-deep to-violet-deep" />
      <div className="-mt-12 flex flex-col items-center px-5 pb-5 text-center sm:-mt-14 sm:flex-row sm:items-start sm:gap-5 sm:text-left">
        {/* La clé remet l'échec de chargement à zéro quand la photo change. */}
        <DirectorPortrait
          key={detail.director_photo_url}
          photoUrl={detail.director_photo_url}
          directorName={detail.director_name}
        />
        {/* À côté du portrait, le nom commence sous le bandeau, jamais dessus. */}
        <div className="mt-3 min-w-0 sm:mt-16">
          <p className="font-display text-2xl leading-display text-navy">
            {detail.director_name || t('detail.headOfSchool')}
          </p>
          {directorTitle && (
            <p className="mt-2 inline-block rounded-full bg-violet-soft px-3 py-1 text-xs font-semibold text-violet-deep">
              {directorTitle}
            </p>
          )}
        </div>
      </div>
      <div className="px-5 pb-5">
        {hasDirectorDetails ? (
          detail.director_bio && (
            <ClampedText
              text={detail.director_bio}
              title={detail.director_name || t('detail.headOfSchool')}
              className="text-base text-ink"
            />
          )
        ) : (
          <p className="text-center text-sm text-ink-soft sm:text-left">
            {t('leadership.none')}
          </p>
        )}
        <div className="mt-4 flex justify-center sm:justify-start">
          <FileButton
            accept={IMAGE_FILE_TYPES}
            disabled={reviewRequest.isSubmitting}
            onSelectFile={proposePhoto}
          >
            <Upload aria-hidden="true" className="size-4" />
            {detail.director_photo_url ? t('leadership.changePhoto') : t('gallery.addPhoto')}
          </FileButton>
        </div>
      </div>
    </div>
  )
}

export default SchoolLeadership
