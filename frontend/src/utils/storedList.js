// Liste d'identifiants mémorisée dans le navigateur. La navigation privée de
// certains navigateurs interdit le stockage : la liste vit alors le temps de
// la visite, sans être retrouvée à la suivante.
export function readStoredList(storageKey) {
  try {
    const storedList = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(storedList) ? storedList.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function writeStoredList(storageKey, list) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(list))
  } catch {
    // Même cas que la lecture : la liste reste valable pour la visite en cours.
  }
}
