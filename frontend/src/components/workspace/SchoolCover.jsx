import { useState } from 'react'
import { GraduationCap } from 'lucide-react'

import StatusBadge from './StatusBadge'
import { toMediaUrl } from '../../utils/media'

// Haut de carte commun aux établissements et à leurs soumissions : la photo
// de couverture, assombrie vers le bas pour porter le nom en blanc, et le
// badge d'état. Sans photo (ou si elle ne se charge pas), un dégradé de la
// marque avec un pictogramme la remplace.
function SchoolCover({ name, coverUrl, status }) {
  const [hasPhotoFailed, setHasPhotoFailed] = useState(false)
  const hasPhoto = coverUrl && !hasPhotoFailed

  return (
    <div className="relative h-44 bg-linear-to-br from-primary to-violet-deep">
      {hasPhoto ? (
        <img
          src={toMediaUrl(coverUrl)}
          alt=""
          loading="lazy"
          onError={() => setHasPhotoFailed(true)}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <GraduationCap
          aria-hidden="true"
          className="absolute right-4 top-4 size-20 text-white/25"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-navy via-navy/40 to-transparent"
      />
      <div className="absolute left-4 top-4">
        <StatusBadge status={status} />
      </div>
      <h3 className="absolute inset-x-4 bottom-3 line-clamp-2 font-display text-2xl leading-display text-white text-balance">
        {name}
      </h3>
    </div>
  )
}

export default SchoolCover
