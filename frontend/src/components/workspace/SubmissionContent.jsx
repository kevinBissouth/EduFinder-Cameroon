import { useTranslation } from 'react-i18next'

import { describeSubmissionContent } from './submissionContent'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import { toMediaUrl } from '../../utils/media'

// Vignettes des images proposées : un clic ouvre l'image entière dans un
// nouvel onglet.
function ImageThumbnails({ imageUrls, label }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {imageUrls.map((imageUrl) => (
        <li key={imageUrl}>
          <a href={toMediaUrl(imageUrl)} target="_blank" rel="noopener noreferrer">
            <img
              src={toMediaUrl(imageUrl)}
              alt={label}
              loading="lazy"
              className="size-24 rounded-control border border-line object-cover"
            />
          </a>
        </li>
      ))}
    </ul>
  )
}

function ContentValue({ line }) {
  if (!line.items) return <dd className="mt-1 whitespace-pre-line text-sm text-navy">{line.text}</dd>

  return (
    <dd className="mt-1">
      <ul className="space-y-1 text-sm text-navy">
        {line.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </dd>
  )
}

// Ce qu'une soumission propose, ligne par ligne.
function SubmissionContent({ content, meta }) {
  const { t } = useTranslation('workspace')
  const translateReference = useReferenceLabel()
  const contentLines = describeSubmissionContent(content, meta, translateReference)

  if (contentLines.length === 0) {
    return <p className="text-sm text-ink-soft">{t('submission.noDetail')}</p>
  }

  return (
    <dl className="space-y-4">
      {contentLines.map((line) => (
        <div key={line.key}>
          <dt className="text-sm font-semibold text-ink-soft">{line.label}</dt>
          <ContentValue line={line} />
          {line.imageUrls.length > 0 && (
            <ImageThumbnails imageUrls={line.imageUrls} label={line.label} />
          )}
        </div>
      ))}
    </dl>
  )
}

export default SubmissionContent
