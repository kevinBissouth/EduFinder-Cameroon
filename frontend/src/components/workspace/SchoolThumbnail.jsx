import { useState } from 'react'
import { GraduationCap } from 'lucide-react'

import { toMediaUrl } from '../../utils/media'

// Petite photo carrée d'un établissement. Sans photo, ou si elle ne se charge
// pas, le dégradé de la marque et le chapeau de diplômé prennent sa place,
// comme sur les cartes.
function SchoolThumbnail({ coverUrl, className = 'size-11' }) {
  const [hasPhotoFailed, setHasPhotoFailed] = useState(false)
  const hasPhoto = coverUrl && !hasPhotoFailed

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-control bg-linear-to-br from-primary to-violet-deep text-white/70 ${className}`}
    >
      {hasPhoto ? (
        <img
          src={toMediaUrl(coverUrl)}
          alt=""
          loading="lazy"
          onError={() => setHasPhotoFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <GraduationCap aria-hidden="true" className="size-1/2" />
      )}
    </span>
  )
}

export default SchoolThumbnail
