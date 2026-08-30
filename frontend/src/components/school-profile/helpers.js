// Constantes et utilitaires partagés par les sections de la fiche établissement.
export const SHADOW_SOFT = 'shadow-[0_2px_12px_rgba(11,122,98,0.04)]'
export const SHADOW_1 = 'shadow-[0_4px_24px_rgba(11,122,98,0.06)]'
export const SHADOW_2 = 'shadow-[0_12px_32px_rgba(11,122,98,0.08)]'

export const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'fees', label: 'Fees' },
  { id: 'programs', label: 'Programs' },
  { id: 'results', label: 'Results' },
  { id: 'services', label: 'Services' },
  { id: 'contact', label: 'Contact' },
]

export const compactFcfa = (amount) =>
  `${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)} FCFA`

export function groupFeesByYear(fees) {
  const groups = new Map()
  fees.forEach((fee) => {
    const schoolYear = fee.school_year || '—'
    if (!groups.has(schoolYear)) groups.set(schoolYear, [])
    groups.get(schoolYear).push(fee)
  })
  return [...groups.entries()]
}
