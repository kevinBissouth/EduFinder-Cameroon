import { useState } from 'react'

import { API_URL } from '../../constants'
import { Image as ImageIcon, Video } from 'lucide-react'

// Une tuile photo : cliquable (vue plein écran), et en cas d'échec de
// chargement on affiche une pastille décorative plutôt que de masquer la
// photo — les visuels de l'établissement doivent toujours rester visibles.
function PhotoTile({ image, featured, onClick }) {
  const [broken, setBroken] = useState(false)
  const url = `${API_URL}${image.url}`

  if (broken) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-[#dcebe3] bg-gradient-to-br from-[#0d7a4f]/10 to-[#d9a406]/10 text-[#0d7a4f] ${
          featured ? 'h-72' : 'h-44'
        }`}
      >
        <ImageIcon className="h-6 w-6" />
        <span className="text-sm font-semibold">{image.caption || 'Photo'}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative block w-full overflow-hidden rounded-2xl border border-[#e7ece9] bg-[#f7f9fb] text-left ${
        featured ? 'h-72' : 'h-44'
      }`}
      aria-label={image.caption || 'View photo'}
    >
      <img
        src={url}
        alt={image.caption || 'School photo'}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        onError={() => setBroken(true)}
      />
      {image.caption && (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          {image.caption}
        </span>
      )}
    </button>
  )
}

// Galerie : la partie photo ne montre que les médias de type image (photo à la
// une en grand puis grille, chacune cliquable). Une sous-partie Vidéos affiche
// les vidéos téléversées quand il y en a — même en l'absence de photos.
function GallerySection({ media = [] }) {
  const images = media.filter((item) => item.type === 'image')
  const videos = media.filter((item) => item.type === 'video')
  const [lightboxUrl, setLightboxUrl] = useState(null)

  if (images.length === 0 && videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#cfe0d7] bg-white/50 py-14 text-center">
        <ImageIcon className="h-8 w-8 text-[#0d7a4f]/50" />
        <p className="text-sm font-medium text-[#5b6670]">No photos published for this school yet.</p>
      </div>
    )
  }

  const [featured, ...rest] = images

  return (
    <section id="gallery" className="scroll-mt-40">
      {images.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {featured && (
              <div className="md:col-span-2">
                <PhotoTile
                  image={featured}
                  featured
                  onClick={() => setLightboxUrl(featured.url)}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
              {rest.slice(0, 2).map((image) => (
                <PhotoTile
                  key={image.id_media}
                  image={image}
                  onClick={() => setLightboxUrl(image.url)}
                />
              ))}
              {rest.length === 0 && (
                <div className="hidden md:block" aria-hidden="true" />
              )}
            </div>
          </div>

          {/* Grille complète si plus de 3 photos */}
          {rest.length > 2 && (
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {rest.slice(2).map((image) => (
                <PhotoTile
                  key={image.id_media}
                  image={image}
                  onClick={() => setLightboxUrl(image.url)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Vidéos téléversées par l'établissement */}
      {videos.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[#0d7a4f]">
            <Video size={16} /> Videos
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {videos.map((video) => (
              <video
                key={video.id_media}
                src={`${API_URL}${video.url}`}
                controls
                preload="metadata"
                className="aspect-video w-full rounded-2xl border border-[#e7ece9] bg-black"
              />
            ))}
          </div>
        </div>
      )}

      {/* Vue plein écran de la photo (lien vers une présentation agrandie) */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <button
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <span className="text-xl font-bold">×</span>
          </button>
          <img
            src={`${API_URL}${lightboxUrl}`}
            alt=""
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </section>
  )
}

export default GallerySection
