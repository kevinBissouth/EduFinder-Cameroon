import { MapPin } from 'lucide-react'

import SchoolCover from './SchoolCover'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'

// La carte d'un établissement en réduction, en tête des fenêtres qui le
// concernent : on voit tout de suite de quelle école il s'agit, et dans quel
// état elle est.
function SchoolMiniature({ school }) {
  const translateReference = useReferenceLabel()
  const tags = [
    translateReference('types', school.type),
    translateReference('sectors', school.sector),
  ].filter(Boolean)

  return (
    <article className="overflow-hidden rounded-panel border border-line bg-surface shadow-soft">
      <SchoolCover
        name={school.name}
        coverUrl={school.cover_url}
        status={school.establishment_status}
        heightClass="h-32"
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <p className="flex items-center gap-1.5 text-sm font-medium text-navy">
          <MapPin aria-hidden="true" className="size-4 shrink-0 text-primary" />
          {school.city}
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-deep"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

export default SchoolMiniature
