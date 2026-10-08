import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from './locales/en/common.json'
import enHome from './locales/en/home.json'
import frCommon from './locales/fr/common.json'
import frHome from './locales/fr/home.json'
import { DEFAULT_LANGUAGE, findLanguage, rememberLanguage, resolveInitialLanguage } from './languages'

const RESOURCES = {
  en: { common: enCommon, home: enHome },
  fr: { common: frCommon, home: frHome },
}

function applyDocumentLanguage(languageCode) {
  document.documentElement.lang = languageCode
}

i18next.use(initReactI18next).init({
  resources: RESOURCES,
  lng: resolveInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: 'common',
  // React échappe déjà tout ce qu'il affiche : un second échappement
  // transformerait les apostrophes du français en entités HTML.
  interpolation: { escapeValue: false },
})

applyDocumentLanguage(i18next.language)
i18next.on('languageChanged', applyDocumentLanguage)

// Réglages de nombres et de dates de la langue affichée, pour les fonctions
// de formatage qui vivent hors des composants.
export function getActiveLanguage() {
  return findLanguage(i18next.resolvedLanguage)
}

// Seul un choix fait par le visiteur est mémorisé : tant qu'il n'a rien
// choisi, le site continue de suivre la langue de son navigateur.
export function chooseLanguage(languageCode) {
  rememberLanguage(languageCode)
  return i18next.changeLanguage(languageCode)
}
