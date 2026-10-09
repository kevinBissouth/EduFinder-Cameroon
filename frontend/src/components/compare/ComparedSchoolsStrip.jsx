import { useState } from 'react'
import { ArrowRight, GraduationCap, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { pickColumnClasses, pickSchoolTone } from './comparisonLayout'
import { API_URL } from '../../constants'
import { buildKeyFigures, findCoverUrl } from '../../utils/comparisonView'
import { formatFcfa, formatPercent } from '../../utils/format'

function SchoolPhoto({ school }) {
  const [hasPhotoFailed, setHasPhotoFailed] = useState(false)
  const coverUrl = findCoverUrl(school)

  if (!coverUrl || hasPhotoFailed) return <GraduationCap aria-hidden="true" className="size-1/3" />
  return (
    <img
      src={`${API_URL}${coverUrl}`}
      alt=""
      onError={() => setHasPhotoFailed(true)}
      className="size-full object-cover"
    />
  )
}

// Les deux chiffres qu'on compare d'abord, visibles dès le haut de page. Sur
// téléphone ils tiennent sur une ligne, sous la ville ; à partir de 640 px
// ils s'affichent côte à côte, en chiffres serif.
function KeyFigures({ school }) {
  const { t } = useTranslation('compare')
  const keyFigures = buildKeyFigures(school)
  const figures = [
    {
      label: t('fees.from'),
      value: keyFigures.lowestFee != null ? formatFcfa(keyFigures.lowestFee) : null,
    },
    {
      label: t('bestPassRate'),
      value: keyFigures.bestPassRate != null ? formatPercent(keyFigures.bestPassRate) : null,
    },
  ]

  return (
    <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 sm:mt-4 sm:grid sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-line sm:border-t sm:border-line sm:pt-4">
      {figures.map((figure) => (
        <div key={figure.label} className="flex flex-wrap items-baseline gap-x-1.5 sm:block sm:first:pr-4 sm:last:pl-4">
          <dt className="whitespace-nowrap text-xs text-ink-soft">{figure.label}</dt>
          <dd
            className={
              figure.value
                ? 'whitespace-nowrap text-xs font-bold tabular-nums text-navy sm:mt-1 sm:font-display sm:text-xl sm:font-normal'
                : 'whitespace-nowrap text-xs text-ink-soft sm:mt-1 sm:text-sm'
            }
          >
            {figure.value ?? t('notPublished')}
          </dd>
        </div>
      ))}
    </dl>
  )
}

// Une seule structure pour deux mises en page. Sur téléphone : une ligne
// compacte (vignette, nom, croix), qui reste lisible avec deux, trois ou
// quatre établissements. À partir de 640 px : une carte, la photo en haut.
// Le liseré coloré est la teinte qui suit l'établissement dans toute la page.
function SchoolTile({ school, schoolIndex, onRemove }) {
  const { t } = useTranslation('compare')
  const tone = pickSchoolTone(schoolIndex)
  const removeLabel = t('remove', { name: school.name })
  const profileHash = `#/school/${school.uuid}`

  return (
    <li
      className={`relative flex items-start gap-3 overflow-hidden rounded-control border border-line border-l-4 bg-surface p-2 shadow-soft sm:block sm:rounded-panel sm:border-l sm:border-t-4 sm:p-0 ${tone.edge}`}
    >
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-control bg-navy text-white/40 sm:h-40 sm:w-full sm:rounded-none lg:h-48">
        <SchoolPhoto school={school} />
      </div>
      <div className="min-w-0 flex-1 sm:p-5">
        <h2 className="text-sm font-bold leading-snug text-navy sm:font-display sm:text-2xl sm:font-normal sm:leading-tight">
          <a href={profileHash} className="block rounded-control py-1.5 hover:text-primary-deep sm:py-0">
            {school.name}
          </a>
        </h2>
        <p className="text-xs text-ink-soft sm:mt-1 sm:text-sm">{school.city}</p>
        <KeyFigures school={school} />
        <a
          href={profileHash}
          className="mt-3 hidden min-h-11 items-center gap-1.5 rounded-control text-sm font-semibold text-primary-deep hover:text-primary sm:inline-flex"
        >
          {t('viewProfile')}
          <ArrowRight aria-hidden="true" className="size-4" />
        </a>
      </div>
      <button
        type="button"
        aria-label={removeLabel}
        title={removeLabel}
        onClick={() => onRemove(school.uuid)}
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-soft hover:bg-danger-soft hover:text-danger-deep sm:absolute sm:right-3 sm:top-3 sm:bg-surface sm:text-navy sm:shadow-soft"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </li>
  )
}

function ComparedSchoolsStrip({ schools, onRemoveSchool }) {
  const { t } = useTranslation('compare')

  return (
    <ul
      aria-label={t('schoolsLabel')}
      className={`grid gap-2 sm:gap-4 ${pickColumnClasses(schools.length)}`}
    >
      {schools.map((school, schoolIndex) => (
        <SchoolTile key={school.uuid} school={school} schoolIndex={schoolIndex} onRemove={onRemoveSchool} />
      ))}
    </ul>
  )
}

export default ComparedSchoolsStrip
