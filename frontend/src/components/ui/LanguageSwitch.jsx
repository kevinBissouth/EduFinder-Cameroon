import { useTranslation } from 'react-i18next'

import { chooseLanguage } from '../../i18n'
import { SUPPORTED_LANGUAGES } from '../../i18n/languages'

const TONE_CLASSES = {
  // Sur l'en-tête bleu nuit du site public.
  onDark: {
    group: 'border-white/20',
    active: 'bg-white text-navy',
    inactive: 'text-on-navy-soft hover:text-white',
  },
  // Sur les fonds clairs : connexion et espaces privés.
  onLight: {
    group: 'border-line bg-surface',
    active: 'bg-primary text-white',
    inactive: 'text-ink-soft hover:text-navy',
  },
}

// Sélecteur à deux segments. Chaque segment garde 44 px de côté, la taille de
// cible tactile recommandée.
function LanguageSwitch({ tone = 'onDark' }) {
  const { t, i18n } = useTranslation()
  const toneClasses = TONE_CLASSES[tone]

  return (
    <div
      role="group"
      aria-label={t('language.switchLabel')}
      className={`inline-flex rounded-full border ${toneClasses.group}`}
    >
      {SUPPORTED_LANGUAGES.map((language) => {
        const isActive = i18n.resolvedLanguage === language.code
        return (
          <button
            key={language.code}
            type="button"
            lang={language.code}
            title={language.name}
            aria-pressed={isActive}
            onClick={() => chooseLanguage(language.code)}
            className={`flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors ${
              isActive ? toneClasses.active : toneClasses.inactive
            }`}
          >
            {language.shortLabel}
          </button>
        )
      })}
    </div>
  )
}

export default LanguageSwitch
