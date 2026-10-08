import i18next from 'i18next'

import { getActiveLanguage } from '../i18n'

// Formatage partagé entre la liste et la fiche : même présentation partout,
// dans les conventions de la langue affichée (montant FCFA entier, pourcentage
// sans zéros superflus après la virgule).
export function formatAmount(amount) {
  return Number(amount).toLocaleString(getActiveLanguage().numberLocale)
}

export function formatFcfa(amount) {
  return `${formatAmount(amount)} FCFA`
}

const PERCENT_FORMAT = { style: 'percent', maximumFractionDigits: 1 }
const PERCENT_SCALE = 100

export function formatPercent(rate) {
  return (Number(rate) / PERCENT_SCALE).toLocaleString(getActiveLanguage().numberLocale, PERCENT_FORMAT)
}

const SHORT_DATE_FORMAT = { day: 'numeric', month: 'short', year: 'numeric' }

export function formatShortDate(isoDate) {
  return new Date(isoDate).toLocaleDateString(getActiveLanguage().dateLocale, SHORT_DATE_FORMAT)
}

const RELATIVE_TIME_STEPS = [
  { unit: 'day', seconds: 86400 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
]

// « 3 hours ago », « yesterday »… en prenant la plus grande unité entière.
export function formatRelativeTime(isoDate) {
  const elapsedSeconds = Math.round((Date.now() - new Date(isoDate).getTime()) / 1000)
  const step = RELATIVE_TIME_STEPS.find((candidate) => elapsedSeconds >= candidate.seconds)
  if (!step) return i18next.t('common:justNow')
  const formatter = new Intl.RelativeTimeFormat(getActiveLanguage().code, { numeric: 'auto' })
  return formatter.format(-Math.floor(elapsedSeconds / step.seconds), step.unit)
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
