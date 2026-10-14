// Brouillon d'une proposition, gardé dans l'onglet (sessionStorage) : un
// téléphone qui recharge la page en arrière-plan ne fait plus perdre la
// saisie. Il disparaît avec l'onglet et à la déconnexion : rien ne reste sur
// un ordinateur partagé.
const DRAFT_KEY_PREFIX = 'edufinder.proposal-draft.'
const CREATION_DRAFT_NAME = 'creation'
const NO_SAVED_DRAFT = { savedDraft: null, isOutdated: false }

export function findDraftKey(school) {
  return `${DRAFT_KEY_PREFIX}${school?.establishment_uuid ?? CREATION_DRAFT_NAME}`
}

// La fiche a pu changer depuis le brouillon (une autre proposition validée
// entre-temps) : reprendre ses anciennes valeurs les renverrait au super
// admin, j'écarte donc le brouillon et je le signale.
export function pickSavedDraft(savedText, profileVersion) {
  const savedDraft = parseSavedDraft(savedText)
  if (!savedDraft) return NO_SAVED_DRAFT
  if (savedDraft.profileVersion !== profileVersion) return { savedDraft: null, isOutdated: true }
  return { savedDraft, isOutdated: false }
}

function parseSavedDraft(savedText) {
  try {
    const savedDraft = JSON.parse(savedText)
    return savedDraft?.draft ? savedDraft : null
  } catch {
    // Un texte illisible ne vient pas de ce formulaire : il n'y a rien à reprendre.
    return null
  }
}

// Le stockage peut être interdit (navigation privée de certains navigateurs) :
// le brouillon vit alors le temps de la page, comme avant.
export function readSavedDraft(draftKey, profileVersion) {
  try {
    return pickSavedDraft(window.sessionStorage.getItem(draftKey), profileVersion)
  } catch {
    return NO_SAVED_DRAFT
  }
}

export function saveDraft(draftKey, savedDraft) {
  try {
    window.sessionStorage.setItem(draftKey, JSON.stringify(savedDraft))
  } catch {
    // Même cas que la lecture : la saisie reste valable sur la page ouverte.
  }
}

export function forgetDraft(draftKey) {
  try {
    window.sessionStorage.removeItem(draftKey)
  } catch {
    // Rien n'a pu être gardé : il n'y a rien à effacer.
  }
}

export function forgetAllDrafts() {
  try {
    Object.keys(window.sessionStorage)
      .filter((storageKey) => storageKey.startsWith(DRAFT_KEY_PREFIX))
      .forEach((storageKey) => window.sessionStorage.removeItem(storageKey))
  } catch {
    // Rien n'a pu être gardé : il n'y a rien à effacer.
  }
}
