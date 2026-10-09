import { useEffect } from 'react'

import { buildSchoolPath } from '../routes'

// Une fiche ouverte par son seul identifiant (« /school/abc ») prend son
// adresse complète, nom compris, dès que l'établissement est connu : c'est
// celle que le visiteur copiera ou partagera. L'historique n'est pas touché.
export function useCanonicalSchoolAddress(institution) {
  useEffect(() => {
    if (!institution) return
    const canonicalPath = buildSchoolPath(institution.uuid, institution.name)
    if (window.location.pathname === canonicalPath) return
    window.history.replaceState(null, '', `${canonicalPath}${window.location.hash}`)
  }, [institution])
}
