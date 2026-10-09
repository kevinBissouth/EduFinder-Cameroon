import { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { pickColumnClasses, pickSchoolTone } from './comparisonLayout'
import { API_URL } from '../../constants'
import { findCoverUrl } from '../../utils/comparisonView'

const FULL_RATE = 100
// Rayon choisi pour que la circonférence vaille 100 : le taux se lit alors
// directement comme une longueur de trait.
const RING_RADIUS = 15.9155

// scroll-mt réserve la hauteur de l'en-tête et des onglets collants, pour que
// le titre du thème ne se glisse pas dessous quand on y saute.
export function ComparisonSection({ id, icon: Icon, title, lead, children }) {
  return (
    <section
      id={id}
      data-reveal=""
      className="scroll-mt-36 rounded-panel border border-line bg-surface p-5 shadow-soft sm:p-8 lg:scroll-mt-40"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-control bg-linear-to-br from-primary to-violet-deep text-white shadow-glow">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <h2 className="font-display text-2xl text-navy sm:text-3xl">{title}</h2>
      </div>
      {lead && <p className="mt-3 max-w-[60ch] text-sm text-ink-soft">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}

// La photo de l'établissement en médaillon, cerclée de sa teinte : on le
// reconnaît d'un thème à l'autre sans relire son nom.
export function SchoolAvatar({ school, schoolIndex, className = 'size-8' }) {
  const [hasPhotoFailed, setHasPhotoFailed] = useState(false)
  const coverUrl = findCoverUrl(school)

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy text-white/50 ring-2 ring-offset-2 ring-offset-surface ${pickSchoolTone(schoolIndex).ring} ${className}`}
    >
      {coverUrl && !hasPhotoFailed ? (
        <img
          src={`${API_URL}${coverUrl}`}
          alt=""
          loading="lazy"
          onError={() => setHasPhotoFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <GraduationCap className="size-1/2" />
      )}
    </span>
  )
}

// Carte d'un établissement : son nom et sa photo en en-tête, sur sa teinte.
// Tout ce qui est dessous lui appartient, sans avoir à chercher une légende.
function SchoolCard({ school, schoolIndex, children }) {
  const tone = pickSchoolTone(schoolIndex)

  return (
    <li className="flex flex-col overflow-hidden rounded-control border border-line bg-surface">
      <div className={`flex items-center gap-3 border-b-2 px-4 py-3 ${tone.tint} ${tone.edge}`}>
        <SchoolAvatar school={school} schoolIndex={schoolIndex} className="size-10" />
        <p className="text-sm font-bold leading-snug text-navy sm:text-base">{school.name}</p>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">{children}</div>
    </li>
  )
}

// Une carte par établissement : empilées sur téléphone, en colonnes dès que
// l'écran le permet. renderSchool fournit le contenu de chaque carte.
export function SchoolColumns({ schools, renderSchool }) {
  return (
    <ul className={`grid gap-4 ${pickColumnClasses(schools.length)}`}>
      {schools.map((school, schoolIndex) => (
        <SchoolCard key={school.uuid} school={school} schoolIndex={schoolIndex}>
          {renderSchool(school, schoolIndex)}
        </SchoolCard>
      ))}
    </ul>
  )
}

export function NotPublished() {
  const { t } = useTranslation('compare')
  return <p className="text-sm text-ink-soft">{t('notPublished')}</p>
}

// Barre de mesure : la partie pleine va jusqu'à filledShare, la partie claire
// se prolonge jusqu'à extendedShare. Elle est décorative pour les lecteurs
// d'écran : la valeur est toujours écrite à côté.
export function MeasureBar({ schoolIndex, filledShare, extendedShare = filledShare }) {
  const tone = pickSchoolTone(schoolIndex)

  return (
    <div aria-hidden="true" className="relative h-2.5 overflow-hidden rounded-full bg-muted">
      <span
        className={`absolute inset-y-0 left-0 rounded-full ${tone.soft}`}
        style={{ width: `${extendedShare}%` }}
      />
      <span
        className={`absolute inset-y-0 left-0 rounded-full ${tone.solid}`}
        style={{ width: `${filledShare}%` }}
      />
    </div>
  )
}

// Anneau de pourcentage : le trait coloré couvre la part du taux, le libellé
// est écrit au centre. Sans taux, l'anneau reste vide et en pointillés.
export function RateRing({ schoolIndex, rate, label }) {
  const hasRate = rate != null

  return (
    <span className="relative flex size-20 shrink-0 items-center justify-center sm:size-24">
      <svg aria-hidden="true" viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="3"
          strokeDasharray={hasRate ? undefined : '1.5 2.5'}
          className="stroke-muted"
        />
        {hasRate && (
          <circle
            cx="18"
            cy="18"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${rate} ${FULL_RATE}`}
            className={pickSchoolTone(schoolIndex).stroke}
          />
        )}
      </svg>
      <span className={hasRate ? 'font-display text-base tabular-nums text-navy sm:text-xl' : 'text-lg text-ink-soft'}>
        {label}
      </span>
    </span>
  )
}
