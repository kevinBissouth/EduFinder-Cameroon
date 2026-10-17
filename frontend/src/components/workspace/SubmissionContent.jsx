import { useTranslation } from 'react-i18next'

import { describeSubmissionContent } from './submissionContent'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import { toMediaUrl } from '../../utils/media'

// Une photo seule s'affiche en entier, sans être recadrée (un portrait reste
// un portrait) ; plusieurs se rangent en grille de vignettes carrées. Un clic
// ouvre l'image entière dans un nouvel onglet.
function ImagePreviews({ imageUrls, label }) {
  const isSingleImage = imageUrls.length === 1
  const listClass = isSingleImage ? 'mt-2' : 'mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3'
  const imageClass = isSingleImage ? 'max-h-72 object-contain' : 'aspect-square object-cover'

  return (
    <ul className={listClass}>
      {imageUrls.map((imageUrl) => (
        <li key={imageUrl}>
          <a href={toMediaUrl(imageUrl)} target="_blank" rel="noopener noreferrer">
            <img
              src={toMediaUrl(imageUrl)}
              alt={label}
              loading="lazy"
              className={`w-full rounded-control border border-line bg-paper ${imageClass}`}
            />
          </a>
        </li>
      ))}
    </ul>
  )
}

// preload="metadata" : seule la première image et la durée se chargent, la
// vidéo entière attend qu'on la lance (les données mobiles coûtent).
function VideoPreviews({ videoUrls }) {
  return (
    <ul className="mt-2 space-y-2">
      {videoUrls.map((videoUrl) => (
        <li key={videoUrl}>
          <video
            src={toMediaUrl(videoUrl)}
            controls
            preload="metadata"
            className="max-h-72 w-full rounded-control bg-navy"
          />
        </li>
      ))}
    </ul>
  )
}

function ContentValue({ line }) {
  if (!line.items) return <dd className="mt-1 whitespace-pre-line text-sm text-navy">{line.text}</dd>

  return (
    <dd className="mt-1.5">
      <ul className="space-y-1.5 text-sm text-navy">
        {line.items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            {item}
          </li>
        ))}
      </ul>
    </dd>
  )
}

function hasPreviews(line) {
  return line.imageUrls.length > 0 || line.videoUrls.length > 0
}

// Ce qu'une soumission propose, une rubrique par ligne.
function SubmissionContent({ content, meta }) {
  const { t } = useTranslation('workspace')
  const translateReference = useReferenceLabel()
  const contentLines = describeSubmissionContent(content, meta, translateReference)

  if (contentLines.length === 0) {
    return <p className="text-sm text-ink-soft">{t('submission.noDetail')}</p>
  }

  return (
    <dl className="divide-y divide-line overflow-hidden rounded-panel border border-line">
      {contentLines.map((line) => (
        <div key={line.key} className="px-4 py-3">
          <dt className="text-xs font-semibold text-ink-soft">{line.label}</dt>
          {/* L'aperçu dit déjà ce qui est proposé : « 1 fichier » ou
              « Nouvelle photo jointe » ne ferait que le répéter. */}
          {!hasPreviews(line) && <ContentValue line={line} />}
          {line.imageUrls.length > 0 && (
            <ImagePreviews imageUrls={line.imageUrls} label={line.label} />
          )}
          {line.videoUrls.length > 0 && <VideoPreviews videoUrls={line.videoUrls} />}
        </div>
      ))}
    </dl>
  )
}

export default SubmissionContent
