import { lazy, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ComparePage from './pages/ComparePage'
import HomePage from './pages/HomePage'
import SavedSchoolsPage from './pages/SavedSchoolsPage'
import SchoolProfilePage from './pages/SchoolProfilePage'
import ToastProvider from './components/workspace/ToastProvider'
import { useRoute } from './hooks/useRoute'
import { HOME_PATH, LOGIN_PATH, MANAGER_PATH, SCHOOL_ADMIN_PATH, navigateTo, redirectTo } from './routes'
import { useScrollOnPageChange } from './hooks/useScrollOnPageChange'
import { clearAuthToken, fetchAuthenticatedProfile } from './utils/auth'

// Les espaces privés embarquent la bibliothèque de graphiques : ils sont
// chargés à part, pour ne pas alourdir le site public.
const ManagerHomePage = lazy(() => import('./pages/ManagerHomePage'))
// La page de connexion embarque sa bibliothèque d'animation, dont le site
// public n'a pas besoin : elle est chargée à part elle aussi.
const importLoginPage = () => import('./pages/LoginPage')
const LoginPage = lazy(importLoginPage)

const IDLE_FALLBACK_DELAY_MS = 2000

// Je télécharge quand même la page de connexion dès que le navigateur est
// inactif : au clic sur « Espace établissements » elle est déjà là, et le
// fondu d'arrivée ne montre pas une page vide.
function preloadLoginPageWhenIdle() {
  const schedule = window.requestIdleCallback ?? ((callback) => window.setTimeout(callback, IDLE_FALLBACK_DELAY_MS))
  schedule(importLoginPage)
}
const AdminHomePage = lazy(() => import('./pages/AdminHomePage'))

const WORKSPACE_PAGES = ['manager', 'school-admin']

// Où renvoyer un visiteur qui n'a pas sa place sur la page demandée, sinon
// null. Tant que la session n'est pas vérifiée (profil indéfini), personne
// n'est renvoyé : un compte connecté ne doit pas passer par la connexion.
function findRedirectPath(page, profile) {
  if (profile === undefined || !WORKSPACE_PAGES.includes(page)) return null
  if (!profile) return LOGIN_PATH
  const isMisplacedManager = page === 'school-admin' && profile.role !== 'super_admin'
  return isMisplacedManager ? MANAGER_PATH : null
}

function App() {
  // Abonne la racine à la langue : au changement, tout l'arbre se redessine,
  // y compris les montants et les dates formatés hors des composants.
  useTranslation()
  const { route, pageKey } = useRoute()
  // Profil restauré depuis /auth/me (le cookie httpOnly n'est pas lisible en
  // JS) ; authChecked évite un faux redirection vers /login le temps du test.
  const [profile, setProfile] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  // Retirer un établissement d'une comparaison change l'adresse sans changer
  // de page : seule la fiche compte son identifiant dans la clé.
  useScrollOnPageChange(pageKey)

  useEffect(preloadLoginPageWhenIdle, [])

  // Une redirection change l'adresse : elle se fait après l'affichage, jamais
  // pendant. En attendant, la page affichée est déjà la bonne (connexion, ou
  // espace responsable).
  const redirectPath = findRedirectPath(route.page, authChecked ? profile : undefined)
  useEffect(() => {
    if (redirectPath) redirectTo(redirectPath)
  }, [redirectPath])

  useEffect(() => {
    fetchAuthenticatedProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setAuthChecked(true))
  }, [])

  function handleAuthenticated(authProfile) {
    setProfile(authProfile)
    navigateTo(authProfile.role === 'super_admin' ? SCHOOL_ADMIN_PATH : MANAGER_PATH)
  }

  function handleSignOut() {
    clearAuthToken()
      .catch(() => {})
      .finally(() => {
        setProfile(null)
        navigateTo(HOME_PATH)
      })
  }

  if (route.page === 'school-detail' && route.id) {
    return <SchoolProfilePage schoolId={route.id} />
  }

  if (route.page === 'compare') {
    return <ComparePage schoolIds={route.ids} />
  }

  if (route.page === 'saved') {
    return <SavedSchoolsPage />
  }

  if (route.page === 'login') {
    return (
      <Suspense fallback={null}>
        <LoginPage onAuthenticated={handleAuthenticated} />
      </Suspense>
    )
  }

  if (route.page === 'manager' || route.page === 'school-admin') {
    if (!authChecked) {
      return null
    }
    if (!profile) {
      return (
        <Suspense fallback={null}>
          <LoginPage onAuthenticated={handleAuthenticated} />
        </Suspense>
      )
    }
    // L'espace super admin n'est accessible qu'au rôle super_admin ; tout
    // autre compte authentifié est redirigé vers l'espace responsable.
    const isAdminSpace = route.page === 'school-admin' && profile.role === 'super_admin'
    const WorkspacePage = isAdminSpace ? AdminHomePage : ManagerHomePage
    return (
      <ToastProvider>
        <Suspense fallback={null}>
          <WorkspacePage profile={profile} onSignOut={handleSignOut} />
        </Suspense>
      </ToastProvider>
    )
  }

  return <HomePage />
}

export default App