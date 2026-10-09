import { useTranslation } from 'react-i18next'

import Notice from '../workspace/Notice'

const SUSPENDED_STATUS = 'suspended'

// Une fiche suspendue a quitté le site public : je le dis en tête d'écran,
// avec le motif donné par le super administrateur, plutôt que de laisser le
// responsable le découvrir sur un badge.
function SuspensionNotice({ detail }) {
  const { t } = useTranslation('manager')

  if (detail.status !== SUSPENDED_STATUS) return null

  return (
    <Notice tone="warning">
      {t('page.suspended')}
      {detail.suspension_reason && (
        <span className="mt-1 block font-normal">
          {t('page.suspensionReason', { reason: detail.suspension_reason })}
        </span>
      )}
    </Notice>
  )
}

export default SuspensionNotice
