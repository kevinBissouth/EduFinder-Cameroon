import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Signale qu'un texte est resté dans la langue de l'établissement, faute de
// version dans celle du visiteur. Sans langue à signaler, rien n'est affiché.
function WrittenInNotice({ languageCode, className = '' }) {
  const { t } = useTranslation('profile')
  if (!languageCode) return null

  return (
    <p className={`flex items-center gap-2 text-sm text-ink-soft ${className}`}>
      <Languages aria-hidden="true" className="size-4 shrink-0" />
      {t(`writtenIn.${languageCode}`)}
    </p>
  )
}

export default WrittenInNotice
