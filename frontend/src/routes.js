export function navigateToHome() {
  window.location.hash = '#/'
}

// Routage minimal pour la page publique d'un établissement.
export function navigateToSchool(id) {
  window.location.hash = `/school/${id}`
}

export function navigateToManagerSpace() {
  window.location.hash = '#/manager'
}

export function navigateToSchoolAdmin() {
  window.location.hash = '#/school-admin'
}

// Analyseur du hash : la valeur retournée par window.location.hash
// inclut le dièse, d'où la correction par rapport à l'ancien code.
export function parseCurrentRoute() {
  const hash = window.location.hash

  if (hash === '#/manager') {
    return { page: 'manager' }
  }

  if (hash === '#/school-admin') {
    return { page: 'school-admin' }
  }

  if (hash === '#/login') {
    return { page: 'login' }
  }

  // School detail : #/school/:id  (ou #/school/:id/... )
  const schoolMatch = hash.replace(/^#/, '').match(/^\/school\/(.+)$/)
  if (schoolMatch) {
    return { page: 'school-detail', id: schoolMatch[1] }
  }

  return { page: 'home' }
}