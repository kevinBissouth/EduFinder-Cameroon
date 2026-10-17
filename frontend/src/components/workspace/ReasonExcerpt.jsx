import { useTranslation } from 'react-i18next'

// Début du motif d'un refus ou d'une suspension, dans une liste : le texte
// entier est dans la fenêtre de détail. La barre seule ne dit rien à un
// lecteur d'écran, d'où le libellé masqué.
function ReasonExcerpt({ reason }) {
  const { t } = useTranslation('workspace')

  return (
    <span className="mt-2 line-clamp-2 border-l-2 border-line pl-2 text-sm text-ink">
      <span className="sr-only">{t('notifications.reasonLabel')} </span>
      {reason}
    </span>
  )
}

export default ReasonExcerpt
