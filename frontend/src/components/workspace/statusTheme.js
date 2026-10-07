// Une seule couleur par état, partout : badges, bandeaux de cartes et
// graphiques. Vert = publié ou approuvé, ambre = en attente, rouge = refusé,
// violet = suspendu.
const NEUTRAL_THEME = {
  badgeClass: 'border-line bg-paper text-ink-soft',
  bandClass: 'bg-ink-soft',
  chartColor: 'var(--color-ink-soft)',
}

const GREEN_THEME = {
  badgeClass: 'border-success-soft bg-success-soft text-success',
  bandClass: 'bg-success',
  chartColor: 'var(--color-success)',
}

const STATUS_THEMES = {
  published: GREEN_THEME,
  approved: GREEN_THEME,
  pending: {
    badgeClass: 'border-warning-soft bg-warning-soft text-warning',
    bandClass: 'bg-accent',
    chartColor: 'var(--color-accent)',
  },
  rejected: {
    badgeClass: 'border-danger-soft bg-danger-soft text-danger-deep',
    bandClass: 'bg-danger',
    chartColor: 'var(--color-danger)',
  },
  suspended: {
    badgeClass: 'border-violet-soft bg-violet-soft text-violet-deep',
    bandClass: 'bg-violet-deep',
    chartColor: 'var(--color-violet-deep)',
  },
}

export function findStatusTheme(status) {
  return STATUS_THEMES[status] ?? NEUTRAL_THEME
}
