import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import StateMessage from '../ui/StateMessage'

// Cadre commun aux vues qui portent sur l'établissement sélectionné : il gère
// les états sans fiche, chargement et erreur. Le contenu n'est rendu qu'avec
// une fiche chargée.
function SchoolSection({
  establishments,
  detail,
  detailStatus,
  onRetry,
  children,
}) {
  const { t } = useTranslation('manager')
  if (establishments.length === 0) {
    return (
      <StateMessage
        icon={Building2}
        title={t('page.noSchoolTitle')}
        description={t('page.noSchoolSection')}
      />
    )
  }
  if (detailStatus === 'error') {
    return (
      <StateMessage
        icon={Building2}
        tone="danger"
        title={t('page.schoolErrorTitle')}
        description={t('page.serverError')}
        actionLabel={t('workspace:retry')}
        onAction={onRetry}
      />
    )
  }
  if (!detail) {
    return (
      <p role="status" className="py-16 text-center text-sm text-ink-soft">
        {t('page.loadingSchool')}
      </p>
    )
  }

  return children(detail)
}

export default SchoolSection
