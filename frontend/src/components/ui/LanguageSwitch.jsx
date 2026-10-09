import { Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { chooseLanguage } from '../../i18n'
import FlagIcon from './FlagIcon'
import { useDismissibleMenu } from '../../hooks/useDismissibleMenu'
import { SUPPORTED_LANGUAGES, findLanguage } from '../../i18n/languages'

// Version compacte pour les barres : un bouton qui montre la langue en cours
// (drapeau et sigle) et ouvre la liste des langues. Les deux tons suivent le fond.
const COMPACT_TONE_CLASSES = {
  // Sur l'en-tête bleu nuit du site public.
  onDark: {
    trigger: 'border-white/20 text-white hover:border-white/50',
    menu: 'border-white/10 bg-navy',
    active: 'bg-white/10 text-white',
    inactive: 'text-on-navy-soft hover:bg-white/10 hover:text-white',
  },
  // Sur les fonds clairs : connexion et espaces privés.
  onLight: {
    trigger: 'border-line bg-surface text-navy hover:border-primary',
    menu: 'border-line bg-surface',
    active: 'bg-primary-soft text-primary-deep',
    inactive: 'text-navy hover:bg-muted',
  },
}

const SEGMENT_CLASSES =
  'flex h-11 cursor-pointer items-center justify-center text-sm font-semibold transition-colors'

function LanguageOption({ language, isActive, toneClasses, onChoose }) {
  return (
    <li role="none">
      <button
        type="button"
        role="menuitemradio"
        aria-checked={isActive}
        lang={language.code}
        onClick={() => onChoose(language.code)}
        className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-control px-3 text-left text-sm font-semibold transition-colors ${
          isActive ? toneClasses.active : toneClasses.inactive
        }`}
      >
        <FlagIcon languageCode={language.code} />
        <span className="flex-1">{language.name}</span>
        {isActive && <Check aria-hidden="true" className="size-4" />}
      </button>
    </li>
  )
}

// La liste s'ouvre sous le bouton, calée sur le bord où il se trouve : à
// droite dans une barre, à gauche dans le menu du téléphone. Calée du mauvais
// côté, elle sortirait de l'écran.
const MENU_ALIGN_CLASSES = { start: 'left-0', end: 'right-0' }

function CompactSwitch({ tone, menuAlign, activeLanguage, groupLabel }) {
  const toneClasses = COMPACT_TONE_CLASSES[tone]
  const { isOpen, setIsOpen, menuRef } = useDismissibleMenu()
  const currentLanguage = findLanguage(activeLanguage)
  const chooseAndClose = (languageCode) => {
    chooseLanguage(languageCode)
    setIsOpen(false)
  }

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${groupLabel} : ${currentLanguage.name}`}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-11 cursor-pointer items-center gap-2 rounded-full border pl-3 pr-2.5 text-sm font-semibold transition-colors ${toneClasses.trigger}`}
      >
        <FlagIcon languageCode={currentLanguage.code} />
        {currentLanguage.shortLabel}
        <ChevronDown
          aria-hidden="true"
          className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <ul
          role="menu"
          aria-label={groupLabel}
          className={`absolute top-full z-20 mt-2 flex w-44 animate-menu-drop flex-col gap-1.5 rounded-panel border p-2 shadow-raised ${MENU_ALIGN_CLASSES[menuAlign]} ${toneClasses.menu}`}
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <LanguageOption
              key={language.code}
              language={language}
              isActive={language.code === currentLanguage.code}
              toneClasses={toneClasses}
              onChoose={chooseAndClose}
            />
          ))}
        </ul>
      )}
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
            <FlagIcon languageCode={language.code} />
            {language.name}
            {isActive && <Check aria-hidden="true" className="size-4" />}
          </button>
        )
      })}
    </div>
  )
}

function LanguageSwitch({ tone = 'onDark', menuAlign = 'end', isWide = false }) {
  const { t, i18n } = useTranslation()
  const switchProps = {
    activeLanguage: i18n.resolvedLanguage,
    groupLabel: t('language.switchLabel'),
  }

  if (isWide) return <WideSwitch {...switchProps} />
  return <CompactSwitch tone={tone} menuAlign={menuAlign} {...switchProps} />
}

export default LanguageSwitch
