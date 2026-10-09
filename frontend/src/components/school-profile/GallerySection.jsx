import { useEffect, useState } from 'react'
import { FileText, X } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import Container from '../ui/Container'
import SectionHeading, { Emphasis } from '../ui/SectionHeading'
import { API_URL } from '../../constants'

const SMALL_GALLERY_PHOTO_COUNT = 2

function PhotoTile({ image, isFeatured, onOpen }) {
  const { t } = useTranslation('profile')
  const [hasImageFailed, setHasImageFailed] = useState(false)
  if (hasImageFailed) return null

  return (
    <li className={isFeatured ? 'col-span-2 row-span-2' : ''}>
      <button
        type="button"
        aria-label={
          image.caption
            ? t('gallery.enlargeNamed', { caption: image.caption })
            : t('gallery.enlarge')
        }
        onClick={() => onOpen(image)}
        className="group block size-full cursor-pointer overflow-hidden rounded-panel bg-muted"
      >
        <img
          src={`${API_URL}${image.url}`}
          alt={image.caption ?? ''}
          loading="lazy"
          onError={() => setHasImageFailed(true)}
          className="aspect-4/3 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </button>
    </li>
  )
}

function VideoTile({ video }) {
  return (
    <li>
      <video
        controls
        preload="metadata"
        src={`${API_URL}${video.url}`}
        className="aspect-video w-full rounded-panel bg-navy"
      />
    </li>
  )
}

// Photo agrandie par-dessus la page. Elle se ferme avec le bouton, un clic
// sur le fond ou la touche Échap.
function Lightbox({ image, onClose }) {
  const { t } = useTranslation('profile')
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('gallery.enlarged')}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/90 p-4 [--focus-ring:var(--color-accent)]"
    >
      <button
        type="button"
        aria-label={t('gallery.close')}
        autoFocus
        onClick={onClose}
        className="absolute right-4 top-4 flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
      >
        <X aria-hidden="true" className="size-5" />
      </button>
      <img
        src={`${API_URL}${image.url}`}
        alt={image.caption ?? ''}
        onClick={(event) => event.stopPropagation()}
        className="max-h-full max-w-full rounded-panel object-contain"
      />
    </div>
  )
}

function GallerySection({ media }) {
  const { t } = useTranslation('profile')
  const [enlargedImage, setEnlargedImage] = useState(null)
  const images = media.filter((mediaItem) => mediaItem.type === 'image')
  const videos = media.filter((mediaItem) => mediaItem.type === 'video')
  const documents = media.filter((mediaItem) => mediaItem.type === 'pdf')
  if (media.length === 0) return null

  // Avec une ou deux photos, la grille de quatre colonnes laissait la moitié
  // de la page vide : photos et vidéos partagent alors une même rangée.
  const isSmallGallery = images.length > 0 && images.length <= SMALL_GALLERY_PHOTO_COUNT

  return (
    <section id="gallery" className="scroll-mt-36 border-t border-line bg-paper py-16 sm:py-20">
      <Container>
        <SectionHeading
          size="md"
          eyebrow={t('gallery.eyebrow')}
          title={<Trans t={t} i18nKey="gallery.title" components={{ emphasis: <Emphasis /> }} />}
        />
        {isSmallGallery && (
          <ul className="mt-10 grid items-start gap-4 md:grid-cols-2">
            {images.map((image) => (
              <PhotoTile key={image.id_media} image={image} onOpen={setEnlargedImage} />
            ))}
            {videos.map((video) => (
              <VideoTile key={video.id_media} video={video} />
            ))}
          </ul>
        )}
        {!isSmallGallery && images.length > 0 && (
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {images.map((image, index) => (
              <PhotoTile
                key={image.id_media}
                image={image}
                isFeatured={index === 0 && images.length > 2}
                onOpen={setEnlargedImage}
              />
            ))}
          </ul>
        )}
        {!isSmallGallery && videos.length > 0 && (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {videos.map((video) => (
              <VideoTile key={video.id_media} video={video} />
            ))}
          </ul>
        )}
        {documents.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-3">
            {documents.map((document) => (
              <li key={document.id_media}>
                <a
                  href={`${API_URL}${document.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-navy transition-colors hover:border-primary hover:text-primary-deep"
                >
                  <FileText aria-hidden="true" className="size-4" />
                  {document.caption ?? t('gallery.document')}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Container>
      {enlargedImage && <Lightbox image={enlargedImage} onClose={() => setEnlargedImage(null)} />}
    </section>
  )
}

export default GallerySection
