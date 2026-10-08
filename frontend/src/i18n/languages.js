export const SUPPORTED_LANGUAGES = [
  { code: 'en', shortLabel: 'EN', name: 'English', numberLocale: 'en-US', dateLocale: 'en-GB' },
  { code: 'fr', shortLabel: 'FR', name: 'Français', numberLocale: 'fr-FR', dateLocale: 'fr-FR' },
]
export const DEFAULT_LANGUAGE = 'en'

const STORAGE_KEY = 'edufinder.language'
const SUPPORTED_CODES = SUPPORTED_LANGUAGES.map((language) => language.code)

// La navigation privée de certains navigateurs interdit l'accès au stockage :
// le choix n'est alors simplement pas mémorisé d'une visite à l'autre.
function readStoredLanguage() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function rememberLanguage(languageCode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, languageCode)
  } catch {
    // Même cas que la lecture : la langue reste active pour la visite en cours.
  }
}

// « fr-CM » ou « fr-FR » comptent pour « fr » : seule la langue m'intéresse,
// pas la région.
function findBrowserLanguage() {
  const preferredCodes = (navigator.languages ?? []).map((tag) => tag.split('-')[0].toLowerCase())
  return preferredCodes.find((code) => SUPPORTED_CODES.includes(code))
}

export function findLanguage(languageCode) {
  return SUPPORTED_LANGUAGES.find((language) => language.code === languageCode) ?? SUPPORTED_LANGUAGES[0]
}

// Le choix fait sur le site l'emporte sur la langue du navigateur.
export function resolveInitialLanguage() {
  const storedLanguage = readStoredLanguage()
  if (SUPPORTED_CODES.includes(storedLanguage)) return storedLanguage
  return findBrowserLanguage() ?? DEFAULT_LANGUAGE
}
