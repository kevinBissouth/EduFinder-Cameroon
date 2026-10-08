import i18next from 'i18next'

import enAdmin from './locales/en/admin.json'
import enManager from './locales/en/manager.json'
import enWorkspace from './locales/en/workspace.json'
import frAdmin from './locales/fr/admin.json'
import frManager from './locales/fr/manager.json'
import frWorkspace from './locales/fr/workspace.json'

// Textes des espaces privés. Ce module n'est importé que par les pages
// chargées à la demande : leurs textes ne pèsent donc pas sur le site public.
const PRIVATE_TEXTS = {
  en: { admin: enAdmin, manager: enManager, workspace: enWorkspace },
  fr: { admin: frAdmin, manager: frManager, workspace: frWorkspace },
}

Object.entries(PRIVATE_TEXTS).forEach(([language, namespaces]) => {
  Object.entries(namespaces).forEach(([namespace, texts]) => {
    i18next.addResourceBundle(language, namespace, texts)
  })
})
