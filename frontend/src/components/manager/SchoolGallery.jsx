import { Trash2, Upload, Video } from 'lucide-react'

import FileButton from '../workspace/FileButton'
import OverflowList from '../workspace/OverflowList'
import { useReviewRequest } from '../../hooks/useModificationProposal'
import { toMediaUrl } from '../../utils/media'

const IMAGE_FILE_TYPES = 'image/*'
const VIDEO_FILE_TYPES = 'video/mp4,video/webm'
const DEFAULT_GRID_CLASSES = 'grid-cols-2 sm:grid-cols-3'
const PHOTOS_SHOWN_WHEN_COLLAPSED = 4
const REMOVE_BUTTON_CLASSES =
  'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-control px-2 text-sm font-semibold text-danger-deep hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60'

function findFileName(mediaUrl) {
  return mediaUrl.split('/').pop()
}

function RemoveButton({ label, disabled, onRemove }) {
  return (
    <button type="button" disabled={disabled} onClick={onRemove} className={REMOVE_BUTTON_CLASSES}>
      <Trash2 aria-hidden="true" className="size-4" />
      {label}
    </button>
  )
}

// Galerie d'une fiche. Ajouter ou retirer un fichier ne change pas la page
// publique tout de suite : chaque demande ouvre une soumission que le super
// administrateur valide.
function SchoolGallery({
  establishmentUuid,
  schoolName,
  media,
  gridClassName = DEFAULT_GRID_CLASSES,
  onProposalSubmitted,
}) {
  const reviewRequest = useReviewRequest(onProposalSubmitted)
  const mediaUrl = `/my/establishments/${establishmentUuid}/media`
  const images = media.filter((mediaItem) => mediaItem.type === 'image')
  const videos = media.filter((mediaItem) => mediaItem.type === 'video')

  const proposeFile = (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return reviewRequest.sendForReview('post', mediaUrl, formData)
  }

  const proposeRemoval = (mediaItem) => {
    const isConfirmed = window.confirm(
      'Ask for this file to be removed from the public page? A super administrator reviews the request.',
    )
    if (isConfirmed) reviewRequest.sendForReview('delete', `${mediaUrl}/${mediaItem.id_media}`)
  }

  return (
    <>
      {media.length === 0 && <p className="mb-5 text-sm text-ink-soft">No photo or video yet.</p>}
      <OverflowList
        items={images}
        collapsedCount={PHOTOS_SHOWN_WHEN_COLLAPSED}
        title="Photos"
        modalSize="lg"
        renderItems={(shownImages) => (
          <ul className={`grid gap-3 ${gridClassName}`}>
            {shownImages.map((image) => (
              <li key={image.id_media}>
                <img
                  src={toMediaUrl(image.url)}
                  alt={image.caption || `Photo of ${schoolName}`}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-control bg-muted object-cover"
                />
                <RemoveButton
                  label="Remove"
                  disabled={reviewRequest.isSubmitting}
                  onRemove={() => proposeRemoval(image)}
                />
              </li>
            ))}
          </ul>
        )}
      />
      <ul className="mt-3 divide-y divide-line">
        {videos.map((video) => (
          <li key={video.id_media} className="flex items-center justify-between gap-3 py-2">
            <span className="flex min-w-0 items-center gap-2 text-sm text-navy">
              <Video aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
              <span className="truncate">{video.caption || findFileName(video.url)}</span>
            </span>
            <RemoveButton
              label="Remove"
              disabled={reviewRequest.isSubmitting}
              onRemove={() => proposeRemoval(video)}
            />
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        <FileButton
          accept={IMAGE_FILE_TYPES}
          disabled={reviewRequest.isSubmitting}
          onSelectFile={proposeFile}
        >
          <Upload aria-hidden="true" className="size-4" />
          Add a photo
        </FileButton>
        <FileButton
          accept={VIDEO_FILE_TYPES}
          disabled={reviewRequest.isSubmitting}
          onSelectFile={proposeFile}
        >
          <Video aria-hidden="true" className="size-4" />
          Add a video
        </FileButton>
      </div>
    </>
  )
}

export default SchoolGallery
