// Formatage partagé entre la liste et la fiche : même présentation partout
// (montant FCFA entier, pourcentage sans zéros superflus après la virgule).
export function formatFcfa(amount) {
  return `${Number(amount).toLocaleString('en-US')} FCFA`
}

export function formatPercent(rate) {
  return `${parseFloat(Number(rate).toFixed(1))}%`
}

const SHORT_DATE_FORMAT = { day: 'numeric', month: 'short', year: 'numeric' }

export function formatShortDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-GB', SHORT_DATE_FORMAT)
}

const RELATIVE_TIME_STEPS = [
  { unit: 'day', seconds: 86400 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
]
const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

// « 3 hours ago », « yesterday »… en prenant la plus grande unité entière.
export function formatRelativeTime(isoDate) {
  const elapsedSeconds = Math.round((Date.now() - new Date(isoDate).getTime()) / 1000)
  const step = RELATIVE_TIME_STEPS.find((candidate) => elapsedSeconds >= candidate.seconds)
  if (!step) return 'just now'
  return relativeTimeFormatter.format(-Math.floor(elapsedSeconds / step.seconds), step.unit)
}

// Initiales d'un nom complet, deux lettres au plus (« Kevin Mbarga » → « KM »).
export function buildInitials(fullName) {
  return fullName
    .split(/\s+/)
    .map((namePart) => namePart[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function findFirstName(fullName) {
  return fullName.trim().split(/\s+/)[0]
}
