import { LOGIN_PATH, MANAGER_PATH, SCHOOL_ADMIN_PATH } from '../routes.js'

const WORKSPACE_PAGES = ['manager', 'school-admin']
const SUPER_ADMIN_ROLE = 'super_admin'

// L'espace privé d'un compte : celui du super administrateur ou celui du
// responsable d'établissement.
export function findWorkspacePath(profile) {
  return profile.role === SUPER_ADMIN_ROLE ? SCHOOL_ADMIN_PATH : MANAGER_PATH
}

// Où renvoyer quelqu'un qui n'a pas sa place sur la page demandée, sinon
// null. Le profil vaut undefined tant que la session n'est pas vérifiée :
// personne n'est alors renvoyé, pour qu'un compte connecté ne passe pas par
// la connexion. Une fois connecté, on ne revoit plus le formulaire de
// connexion, ni par un lien ni par le bouton Précédent : il mène à l'espace.
export function findRedirectPath(page, profile) {
  if (profile === undefined) return null
  if (page === 'login') return profile ? findWorkspacePath(profile) : null
  if (!WORKSPACE_PAGES.includes(page)) return null
  if (!profile) return LOGIN_PATH
  const isMisplacedManager = page === 'school-admin' && profile.role !== SUPER_ADMIN_ROLE
  return isMisplacedManager ? MANAGER_PATH : null
}
