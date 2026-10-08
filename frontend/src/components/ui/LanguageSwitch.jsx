import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { chooseLanguage } from '../../i18n'
import { SUPPORTED_LANGUAGES } from '../../i18n/languages'

// Version compacte (sigles) pour les barres ; les deux tons suivent le fond.
const COMPACT_TONE_CLASSES = {
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

const SEGMENT_CLASSES =
  'flex h-11 cursor-pointer items-center justify-center text-sm font-semibold transition-colors'

function CompactSwitch({ tone, activeLanguage, groupLabel }) {
  const toneClasses = COMPACT_TONE_CLASSES[tone]

  return (
    <div
      role="group"
      aria-label={groupLabel}
      className={`inline-flex rounded-full border ${toneClasses.group}`}
    >
      {SUPPORTED_LANGUAGES.map((language) => {
        const isActive = activeLanguage === language.code
        return (
          <button
            key={language.code}
            type="button"
            lang={language.code}
            title={language.name}
            aria-pressed={isActive}
            onClick={() => chooseLanguage(language.code)}
            className={`${SEGMENT_CLASSES} min-w-11 rounded-full px-3 ${
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

// Version large, pour une page de réglages : le nom complet de chaque langue,
// sur toute la largeur, la langue active en dégradé avec une coche.
function WideSwitch({ activeLanguage, groupLabel }) {
  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="flex gap-1 rounded-panel border border-line bg-paper p-1"
    >
      {SUPPORTED_LANGUAGES.map((language) => {
        const isActive = activeLanguage === language.code
        return (
          <button
            key={language.code}
            type="button"
            lang={language.code}
            aria-pressed={isActive}
            onClick={() => chooseLanguage(language.code)}
            className={`${SEGMENT_CLASSES} flex-1 gap-2 rounded-control ${
              isActive
                ? 'bg-linear-to-br from-primary to-violet-deep text-white shadow-soft'
                : 'text-navy hover:bg-surface'
            }`}
          >
            {isActive && <Check aria-hidden="true" className="size-4" />}
            {language.name}
          </button>
        )
      })}
    </div>
  )
}

function LanguageSwitch({ tone = 'onDark', isWide = false }) {
  const { t, i18n } = useTranslation()
  const switchProps = {
    activeLanguage: i18n.resolvedLanguage,
    groupLabel: t('language.switchLabel'),
  }

  return isWide ? <WideSwitch {...switchProps} /> : <CompactSwitch tone={tone} {...switchProps} />
}

export default LanguageSwitch
