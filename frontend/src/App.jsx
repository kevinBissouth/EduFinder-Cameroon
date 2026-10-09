import { lazy, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ComparePage from './pages/ComparePage'
import HomePage from './pages/HomePage'
import LegalPage from './pages/LegalPage'
import SavedSchoolsPage from './pages/SavedSchoolsPage'
import SchoolProfilePage from './pages/SchoolProfilePage'
import ToastProvider from './components/workspace/ToastProvider'
import { useRoute } from './hooks/useRoute'
import { HOME_PATH, navigateTo, redirectTo } from './routes'
import { SessionContext } from './session/sessionContext'
import { findRedirectPath, findWorkspacePath } from './utils/sessionRoutes'
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

const LEGAL_DOCUMENT_BY_PAGE = { 'legal-notice': 'notice', privacy: 'privacy' }

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

  // L'espace remplace la connexion dans l'historique : Précédent ramène alors
  // au site public, pas au formulaire qu'on vient de remplir.
  function handleAuthenticated(authProfile) {
    setProfile(authProfile)
    redirectTo(findWorkspacePath(authProfile))
  }

  function handleSignOut() {
    clearAuthToken()
      .catch(() => {})
      .finally(() => {
        setProfile(null)
        navigateTo(HOME_PATH)
      })
  }

  function renderPage() {
    if (route.page === 'school-detail' && route.id) {
      return <SchoolProfilePage schoolId={route.id} />
    }

    if (route.page === 'compare') {
      return <ComparePage schoolIds={route.ids} />
    }

    if (route.page === 'saved') {
      return <SavedSchoolsPage />
    }

    if (route.page in LEGAL_DOCUMENT_BY_PAGE) {
      return <LegalPage documentKey={LEGAL_DOCUMENT_BY_PAGE[route.page]} />
    }

    if (route.page === 'login') {
      // Tant que la session n'est pas vérifiée, ou pour un compte déjà connecté
      // (qui va être renvoyé vers son espace), le formulaire ne s'affiche pas.
      if (!authChecked || profile) return null
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

  const signedInProfile = authChecked ? profile : null
  return <SessionContext.Provider value={signedInProfile}>{renderPage()}</SessionContext.Provider>
}

export default App