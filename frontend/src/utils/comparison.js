// Règles de la comparaison, sans affichage : nombre d'établissements, forme
// de l'adresse partageable.
export const MIN_COMPARED_SCHOOLS = 2
export const MAX_COMPARED_SCHOOLS = 4

const COMPARISON_PATH = '/compare/'
const ID_SEPARATOR = ','

// Une sélection propre : sans doublon, sans valeur vide, quatre au plus. Un
// lien bricolé ou trop long donne donc toujours une comparaison valide.
export function normalizeComparedIds(schoolIds) {
  const uniqueIds = [...new Set(schoolIds.map((schoolId) => schoolId.trim()).filter(Boolean))]
  return uniqueIds.slice(0, MAX_COMPARED_SCHOOLS)
}

export function buildComparisonHash(schoolIds) {
  return `#${COMPARISON_PATH}${normalizeComparedIds(schoolIds).join(ID_SEPARATOR)}`
}

// Identifiants portés par le chemin « /compare/a,b,c » ; null pour un autre chemin.
export function parseComparisonPath(path) {
  if (!path.startsWith(COMPARISON_PATH)) return null
  return normalizeComparedIds(path.slice(COMPARISON_PATH.length).split(ID_SEPARATOR))
}

export function includesAllIds(containerIds, schoolIds) {
  return schoolIds.every((schoolId) => containerIds.includes(schoolId))
}

// Les mêmes établissements, quel que soit leur ordre.
export function isSameSelection(firstIds, secondIds) {
  return firstIds.length === secondIds.length && includesAllIds(firstIds, secondIds)
}

export function canCompare(schoolIds) {
  return schoolIds.length >= MIN_COMPARED_SCHOOLS
}

export function isComparisonFull(schoolIds) {
  return schoolIds.length >= MAX_COMPARED_SCHOOLS
}
