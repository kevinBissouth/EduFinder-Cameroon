import Container from './ui/Container'
import SectionHeading from './ui/SectionHeading'

const DONUT_RADIUS = 80
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS
// Petit vide laissé entre deux parts, pour que chacune se détache.
const SEGMENT_GAP = 3
// Une couleur par part du graphique, dans l'ordre des plus grandes parts.
const SEGMENT_STYLES = [
  { stroke: 'stroke-primary', dot: 'bg-primary' },
  { stroke: 'stroke-violet', dot: 'bg-violet' },
  { stroke: 'stroke-accent', dot: 'bg-accent' },
  { stroke: 'stroke-primary-soft', dot: 'bg-primary-soft' },
  { stroke: 'stroke-on-navy-soft', dot: 'bg-on-navy-soft' },
]

// Répartition des établissements publiés par type, des plus nombreux aux
// moins nombreux. Chaque part connaît la fraction du cercle qui la précède.
function buildTypeShares(institutions) {
  const schoolCountByType = new Map()
  institutions.forEach((institution) => {
    schoolCountByType.set(institution.type, (schoolCountByType.get(institution.type) ?? 0) + 1)
  })
  const sortedTypes = [...schoolCountByType.entries()].sort(
    (firstType, secondType) => secondType[1] - firstType[1],
  )
  let precedingFraction = 0
  return sortedTypes.map(([typeName, schoolCount], index) => {
    const fraction = schoolCount / institutions.length
    const share = {
      typeName,
      schoolCount,
      fraction,
      precedingFraction,
      style: SEGMENT_STYLES[index % SEGMENT_STYLES.length],
    }
    precedingFraction += fraction
    return share
  })
}

// Bord courbe qui fait entrer la section claire voisine dans le bleu nuit.
function CurvedEdge({ fillClass }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      className={`block h-10 w-full sm:h-14 ${fillClass}`}
    >
      <path d="M0 0 H1440 V12 C 1000 72, 440 72, 0 12 Z" />
    </svg>
  )
}

function Figure({ value, label }) {
  return (
    <div className="border-t border-white/15 pt-5">
      <dd className="font-display text-5xl leading-none tabular-nums text-white">{value}</dd>
      <dt className="mt-2 text-sm text-on-navy-soft">{label}</dt>
    </div>
  )
}

// Le graphique est doublé d'une légende chiffrée : l'information ne repose
// jamais sur la seule couleur.
function TypeDonut({ shares, schoolCount }) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Schools by type" className="size-48 shrink-0 -rotate-90 sm:size-56">
      <circle cx="100" cy="100" r={DONUT_RADIUS} fill="none" strokeWidth="18" className="stroke-white/10" />
      {shares.map((share) => (
        <circle
          key={share.typeName}
          cx="100"
          cy="100"
          r={DONUT_RADIUS}
          fill="none"
          strokeWidth="18"
          strokeDasharray={`${Math.max(share.fraction * DONUT_CIRCUMFERENCE - SEGMENT_GAP, 1)} ${DONUT_CIRCUMFERENCE}`}
          strokeDashoffset={-share.precedingFraction * DONUT_CIRCUMFERENCE}
          className={share.style.stroke}
        />
      ))}
      <text
        x="100"
        y="100"
        textAnchor="middle"
        dominantBaseline="central"
        transform="rotate(90 100 100)"
        className="fill-white font-display text-4xl"
      >
        {schoolCount}
      </text>
    </svg>
  )
}

function TypeLegend({ shares }) {
  return (
    <ul className="w-full divide-y divide-white/10">
      {shares.map((share) => (
        <li key={share.typeName} className="flex items-center gap-3 py-2.5 text-sm">
          <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${share.style.dot}`} />
          <span className="text-white">{share.typeName}</span>
          <span className="ml-auto tabular-nums text-on-navy-soft">
            {share.schoolCount} ({Math.round(share.fraction * 100)}%)
          </span>
        </li>
      ))}
    </ul>
  )
}

function GlobalPicture({ institutions, figures }) {
  if (institutions.length === 0) return null

  const typeShares = buildTypeShares(institutions)
  const platformFigures = [
    { value: institutions.length, label: 'Schools listed' },
    { value: figures.cityCount, label: 'Cities covered' },
    { value: figures.feePlanCount, label: 'Fee lines published' },
    { value: figures.examResultCount, label: 'Exam results published' },
  ]

  return (
    <section id="global-picture" className="relative scroll-mt-20 overflow-hidden bg-navy">
      {/* Deux halos très légers donnent de la profondeur à l'aplat bleu nuit. */}
      <span
        aria-hidden="true"
        className="absolute -left-40 top-1/3 size-96 rounded-full bg-radial from-primary/25 to-transparent to-70%"
      />
      <span
        aria-hidden="true"
        className="absolute -right-32 bottom-0 size-96 rounded-full bg-radial from-violet/15 to-transparent to-70%"
      />
      <CurvedEdge fillClass="relative fill-surface" />
      <Container className="relative grid items-center gap-12 pb-16 pt-12 sm:pb-24 sm:pt-20 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeading
            tone="onNavy"
            eyebrow="The global picture"
            title="Schooling in Cameroon, in numbers."
            lead="Every figure counts published listings only, across all ten regions of the country."
          />
          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8">
            {platformFigures.map((figure) => (
              <Figure key={figure.label} value={figure.value} label={figure.label} />
            ))}
          </dl>
        </div>

        <div className="rounded-panel border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:p-8">
          <h3 className="text-lg font-bold text-white">Schools by type</h3>
          <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row">
            <TypeDonut shares={typeShares} schoolCount={institutions.length} />
            <TypeLegend shares={typeShares} />
          </div>
        </div>
      </Container>
    </section>
  )
}

export default GlobalPicture
