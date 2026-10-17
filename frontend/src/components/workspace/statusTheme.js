// Une seule couleur par état, partout : badges, bandeaux de cartes et
// graphiques. Vert = publié ou approuvé, ambre = en attente, rouge = refusé,
// violet = suspendu. markClass habille une petite pastille pleine portant une
// icône ; textClass colore un texte posé sur fond clair.
const NEUTRAL_THEME = {
  badgeClass: 'border-line bg-paper text-ink-soft',
  bandClass: 'bg-ink-soft',
  markClass: 'bg-ink-soft text-white',
  textClass: 'text-ink',
  chartColor: 'var(--color-ink-soft)',
}

const GREEN_THEME = {
  badgeClass: 'border-success-soft bg-success-soft text-success',
  bandClass: 'bg-success',
  markClass: 'bg-success text-white',
  textClass: 'text-success',
  chartColor: 'var(--color-success)',
}

const STATUS_THEMES = {
  published: GREEN_THEME,
  approved: GREEN_THEME,
  pending: {
    badgeClass: 'border-warning-soft bg-warning-soft text-warning',
    bandClass: 'bg-accent',
    markClass: 'bg-accent text-navy',
    textClass: 'text-warning',
    chartColor: 'var(--color-accent)',
  },
  rejected: {
    badgeClass: 'border-danger-soft bg-danger-soft text-danger-deep',
    bandClass: 'bg-danger',
    markClass: 'bg-danger text-white',
    textClass: 'text-danger-deep',
    chartColor: 'var(--color-danger)',
  },
  suspended: {
    badgeClass: 'border-violet-soft bg-violet-soft text-violet-deep',
    bandClass: 'bg-violet-deep',
    markClass: 'bg-violet-deep text-white',
    textClass: 'text-violet-deep',
    chartColor: 'var(--color-violet-deep)',
  },
}

export function findStatusTheme(status) {
  return STATUS_THEMES[status] ?? NEUTRAL_THEME
}
