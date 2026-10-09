import { buildComparisonHash, parseComparisonPath } from './utils/comparison.js'

export function navigateToHome() {
  window.location.hash = '#/'
}

// La page d'accueil, à la hauteur des résultats : c'est là qu'on choisit.
export function navigateToSearchResults() {
  window.location.hash = '#results'
}

// Routage minimal pour la page publique d'un établissement.
export function navigateToSchool(id) {
  window.location.hash = `/school/${id}`
}

export function navigateToComparison(schoolIds) {
  window.location.hash = buildComparisonHash(schoolIds)
}

export function navigateToManagerSpace() {
  window.location.hash = '#/manager'
}

export function navigateToSchoolAdmin() {
  window.location.hash = '#/school-admin'
}

// Analyseur du hash : la valeur retournée par window.location.hash inclut le
// dièse. La fonction prend le hash en paramètre pour se tester sans navigateur.
const FIXED_PAGES = {
  '#/manager': 'manager',
  '#/school-admin': 'school-admin',
  '#/login': 'login',
  '#/saved': 'saved',
}

export function parseRoute(hash) {
  if (hash in FIXED_PAGES) return { page: FIXED_PAGES[hash] }

  const path = hash.replace(/^#/, '')
  const comparedIds = parseComparisonPath(path)
  if (comparedIds) return { page: 'compare', ids: comparedIds }

  // School detail : #/school/:id  (ou #/school/:id/... )
  const schoolMatch = path.match(/^\/school\/(.+)$/)
  if (schoolMatch) return { page: 'school-detail', id: schoolMatch[1] }

  return { page: 'home' }
}

export function parseCurrentRoute() {
  return parseRoute(window.location.hash)
}
