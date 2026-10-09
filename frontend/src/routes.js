import { buildComparisonPath, parseComparisonPath } from './utils/comparison.js'
import { toSlug } from './utils/slug.js'

// Routage minimal, sans dépendance. Les adresses sont de vrais chemins
// (« /school/… ») : un moteur de recherche ou une messagerie peut ainsi lire
// chaque page à sa propre adresse, ce qu'un « # » ne permettait pas.
export const HOME_PATH = '/'
export const LOGIN_PATH = '/login'
export const SAVED_SCHOOLS_PATH = '/saved'
export const MANAGER_PATH = '/manager'
export const SCHOOL_ADMIN_PATH = '/school-admin'
export const LEGAL_NOTICE_PATH = '/legal'
export const PRIVACY_PATH = '/privacy'
// La page d'accueil, à la hauteur des résultats : c'est là qu'on choisit.
export const SEARCH_RESULTS_PATH = '/#results'
const SCHOOL_PATH = '/school/'
const LEGACY_HASH_PREFIX = '#/'

const NAVIGATION_EVENT = 'edufinder:navigate'

const FIXED_PAGES = {
  [MANAGER_PATH]: 'manager',
  [SCHOOL_ADMIN_PATH]: 'school-admin',
  [LOGIN_PATH]: 'login',
  [SAVED_SCHOOLS_PATH]: 'saved',
  [LEGAL_NOTICE_PATH]: 'legal-notice',
  [PRIVACY_PATH]: 'privacy',
}

// L'identifiant suffit à trouver la fiche ; le nom qui le suit ne sert qu'à
// rendre l'adresse lisible, et l'analyseur l'ignore.
export function buildSchoolPath(schoolId, schoolName = '') {
  const slug = toSlug(schoolName)
  return slug ? `${SCHOOL_PATH}${schoolId}/${slug}` : `${SCHOOL_PATH}${schoolId}`
}

// L'analyseur prend le chemin en paramètre pour se tester sans navigateur.
export function parseRoute(pathname) {
  if (pathname in FIXED_PAGES) return { page: FIXED_PAGES[pathname] }

  const comparedIds = parseComparisonPath(pathname)
  if (comparedIds) return { page: 'compare', ids: comparedIds }

  const schoolMatch = pathname.match(/^\/school\/([^/]+)/)
  if (schoolMatch) return { page: 'school-detail', id: schoolMatch[1] }

  return { page: 'home' }
}

// Un chemin que le site affiche lui-même. Les autres adresses du même domaine
// (fichiers téléversés, API) sont laissées au navigateur.
export function isSitePath(pathname) {
  return pathname === HOME_PATH || parseRoute(pathname).page !== 'home'
}

// Un ancien lien « /#/school/… », enregistré ou partagé avant le passage aux
// vrais chemins : je renvoie le chemin qu'il désignait, sinon null.
export function readLegacyHashPath(hash) {
  return hash.startsWith(LEGACY_HASH_PREFIX) ? hash.slice(1) : null
}

export function parseCurrentRoute() {
  return parseRoute(window.location.pathname)
}

function announceNavigation() {
  window.dispatchEvent(new Event(NAVIGATION_EVENT))
}

// Change de page sans recharger le site : l'adresse entre dans l'historique
// et le crochet useRoute affiche la page.
export function navigateTo(path) {
  window.history.pushState(null, '', path)
  announceNavigation()
}

// Comme navigateTo, mais l'adresse quittée ne reste pas dans l'historique :
// pour une redirection, où Précédent ne doit pas y ramener.
export function redirectTo(path) {
  window.history.replaceState(null, '', path)
  announceNavigation()
}

export function onNavigation(listener) {
  window.addEventListener(NAVIGATION_EVENT, listener)
  window.addEventListener('popstate', listener)
  return () => {
    window.removeEventListener(NAVIGATION_EVENT, listener)
    window.removeEventListener('popstate', listener)
  }
}

export function navigateToHome() {
  navigateTo(HOME_PATH)
}

export function navigateToSearchResults() {
  navigateTo(SEARCH_RESULTS_PATH)
}

export function navigateToSchool(schoolId) {
  navigateTo(buildSchoolPath(schoolId))
}

export function navigateToComparison(schoolIds) {
  navigateTo(buildComparisonPath(schoolIds))
}
