import { useEffect, useState } from 'react'
import HomePage from './pages/HomePage'
import SchoolProfilePage from './pages/SchoolProfilePage'
import LoginPage from './pages/LoginPage'
import ManagerHomePage from './pages/ManagerHomePage'
import { parseCurrentRoute } from './routes'
import { clearAuthToken, fetchAuthenticatedProfile } from './utils/auth'

function App() {
  const [route, setRoute] = useState(() => parseCurrentRoute())
  // Profil restauré depuis /auth/me (le cookie httpOnly n'est pas lisible en
  // JS) ; authChecked évite un faux redirection vers /login le temps du test.
  const [profile, setProfile] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const onHashChange = () => setRoute(parseCurrentRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

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
    return <ManagerHomePage profile={profile} onSignOut={handleSignOut} />
  }

  return <HomePage />
}

export default App