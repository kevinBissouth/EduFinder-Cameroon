import { lazy, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ComparePage from './pages/ComparePage'
import HomePage from './pages/HomePage'
import SavedSchoolsPage from './pages/SavedSchoolsPage'
import SchoolProfilePage from './pages/SchoolProfilePage'
import LoginPage from './pages/LoginPage'
import ToastProvider from './components/workspace/ToastProvider'
import { useHashRoute } from './hooks/useHashRoute'
import { useScrollOnPageChange } from './hooks/useScrollOnPageChange'
import { clearAuthToken, fetchAuthenticatedProfile } from './utils/auth'

// Les espaces privés embarquent la bibliothèque de graphiques : ils sont
// chargés à part, pour ne pas alourdir le site public.
const ManagerHomePage = lazy(() => import('./pages/ManagerHomePage'))

function App() {
  // Abonne la racine à la langue : au changement, tout l'arbre se redessine,
  // y compris les montants et les dates formatés hors des composants.
  useTranslation()
  const { route, pageKey } = useHashRoute()
  // Profil restauré depuis /auth/me (le cookie httpOnly n'est pas lisible en
  // JS) ; authChecked évite un faux redirection vers /login le temps du test.
  const [profile, setProfile] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  // Retirer un établissement d'une comparaison change l'adresse sans changer
  // de page : seule la fiche compte son identifiant dans la clé.
  useScrollOnPageChange(pageKey)

  useEffect(() => {
    fetchAuthenticatedProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setAuthChecked(true))
  }, [])

  function handleAuthenticated(authProfile) {
    setProfile(authProfile)
    if (authProfile.role === 'super_admin') {
      window.location.hash = '#/school-admin'
    } else {
      window.location.hash = '#/manager'
    }
  }

  function handleSignOut() {
    clearAuthToken()
      .catch(() => {})
      .finally(() => {
        setProfile(null)
        window.location.hash = '#/'
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
    return <LoginPage onAuthenticated={handleAuthenticated} />
  }

  if (route.page === 'manager' || route.page === 'school-admin') {
    if (!authChecked) {
      return null
    }
    if (!profile) {
      window.location.hash = '#/login'
      return <LoginPage onAuthenticated={handleAuthenticated} />
    }
    // L'espace super admin n'est accessible qu'au rôle super_admin ; tout
    // autre compte authentifié est redirigé vers l'espace responsable.
    const isAdminSpace = route.page === 'school-admin' && profile.role === 'super_admin'
    if (route.page === 'school-admin' && !isAdminSpace) {
      window.location.hash = '#/manager'
    }
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