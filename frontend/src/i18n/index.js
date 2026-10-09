import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import enAuth from './locales/en/auth.json'
import enCommon from './locales/en/common.json'
import enCompare from './locales/en/compare.json'
import enHome from './locales/en/home.json'
import enProfile from './locales/en/profile.json'
import frAuth from './locales/fr/auth.json'
import frCommon from './locales/fr/common.json'
import frCompare from './locales/fr/compare.json'
import frHome from './locales/fr/home.json'
import frProfile from './locales/fr/profile.json'
import { DEFAULT_LANGUAGE, findLanguage, rememberLanguage, resolveInitialLanguage } from './languages'

const RESOURCES = {
  en: { auth: enAuth, common: enCommon, compare: enCompare, home: enHome, profile: enProfile },
  fr: { auth: frAuth, common: frCommon, compare: frCompare, home: frHome, profile: frProfile },
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
