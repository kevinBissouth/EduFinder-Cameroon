// Les graphiques reprennent les jetons du thème : aucune couleur n'est
// écrite ici, seulement le nom du jeton.
export const CHART_COLORS = {
  primary: 'var(--color-primary)',
  primaryDeep: 'var(--color-primary-deep)',
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
  violetDeep: 'var(--color-violet-deep)',
  violet: 'var(--color-violet)',
  danger: 'var(--color-danger)',
  navy: 'var(--color-navy)',
  grid: 'var(--color-line)',
  axis: 'var(--color-ink-soft)',
}

// Ordre d'attribution des couleurs quand un graphique a plusieurs séries.
export const SERIES_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.violet,
  CHART_COLORS.primaryDeep,
  CHART_COLORS.navy,
]

export const AXIS_TICK = { fill: CHART_COLORS.axis, fontSize: 12 }
export const CHART_MARGIN = { top: 8, right: 8, bottom: 0, left: -16 }
