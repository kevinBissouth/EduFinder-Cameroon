import i18next from 'i18next'

import enManager from './locales/en/manager.json'
import enWorkspace from './locales/en/workspace.json'
import frManager from './locales/fr/manager.json'
import frWorkspace from './locales/fr/workspace.json'

// Textes des espaces privés. Ce module n'est importé que par les pages
// chargées à la demande : leurs textes ne pèsent donc pas sur le site public.
const PRIVATE_TEXTS = {
  en: { manager: enManager, workspace: enWorkspace },
  fr: { manager: frManager, workspace: frWorkspace },
}

Object.entries(PRIVATE_TEXTS).forEach(([language, namespaces]) => {
  Object.entries(namespaces).forEach(([namespace, texts]) => {
    i18next.addResourceBundle(language, namespace, texts)
  })
})
