// Les années scolaires s'écrivent toutes « AAAA-AAAA » : l'ordre alphabétique
// est donc aussi l'ordre chronologique.
export function findLatestYear(schoolYears) {
  return [...schoolYears].sort().at(-1) ?? null
}
