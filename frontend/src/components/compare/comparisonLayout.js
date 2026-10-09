// Une teinte par établissement comparé, la même dans toute la page : elle
// aide à suivre une école d'un thème à l'autre. Elle n'est jamais le seul
// repère (le nom est toujours écrit) et ne juge rien : ni vert, ni rouge.
const SCHOOL_TONES = [
  { solid: 'bg-primary', soft: 'bg-primary/25', tint: 'bg-primary/8', ring: 'ring-primary', stroke: 'stroke-primary', edge: 'border-primary' },
  { solid: 'bg-violet-deep', soft: 'bg-violet-deep/25', tint: 'bg-violet-deep/8', ring: 'ring-violet-deep', stroke: 'stroke-violet-deep', edge: 'border-violet-deep' },
  { solid: 'bg-success', soft: 'bg-success/25', tint: 'bg-success/8', ring: 'ring-success', stroke: 'stroke-success', edge: 'border-success' },
  { solid: 'bg-accent', soft: 'bg-accent/30', tint: 'bg-accent/12', ring: 'ring-accent', stroke: 'stroke-accent', edge: 'border-accent' },
]

export function pickSchoolTone(schoolIndex) {
  return SCHOOL_TONES[schoolIndex % SCHOOL_TONES.length]
}

// Autant de colonnes que d'établissements dès que l'écran le permet : avec
// deux écoles, deux grandes cartes remplissent la ligne au lieu de laisser
// la moitié de la page vide.
const COLUMN_CLASSES_BY_SCHOOL_COUNT = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export function pickColumnClasses(schoolCount) {
  return COLUMN_CLASSES_BY_SCHOOL_COUNT[schoolCount] ?? 'sm:grid-cols-2'
}

// Ancres des thèmes, partagées entre les onglets collants et les sections.
// Le préfixe évite toute confusion avec les ancres de la page d'accueil.
export const COMPARISON_SECTION_IDS = {
  profile: 'compare-profile',
  fees: 'compare-fees',
  results: 'compare-results',
  offer: 'compare-offer',
  contact: 'compare-contact',
}
