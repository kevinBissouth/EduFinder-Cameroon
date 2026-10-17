import { useTranslation } from 'react-i18next'

import Modal from '../ui/Modal'
import SchoolWindowFooter from './SchoolWindowFooter'
import ReasonQuote from '../workspace/ReasonQuote'
import SchoolMiniature from '../workspace/SchoolMiniature'
import { presentNotification } from '../workspace/notificationMessages'
import { formatShortDate } from '../../utils/format'

const SUSPENDED_STATUS = 'suspended'

// Une suspension ou une réactivation ne passe par aucune soumission : la
// fenêtre montre l'école, ce que l'événement change pour sa fiche publique et,
// pour une suspension, le motif à corriger.
function EstablishmentEventModal({ notification, school, onOpenSchool, onClose }) {
  const { t } = useTranslation('manager')
  const { Icon, markClass, verdict } = presentNotification(notification)

  return (
    <Modal
      icon={Icon}
      iconClassName={markClass}
      title={verdict}
      description={formatShortDate(notification.created_at)}
      onClose={onClose}
      footer={<SchoolWindowFooter school={school} onOpenSchool={onOpenSchool} onClose={onClose} />}
    >
      <div className="space-y-5">
        {school && <SchoolMiniature school={school} />}
        <p className="text-sm text-ink text-pretty">
          {t(`notificationWindow.explanations.${notification.kind}`, { defaultValue: '' })}
        </p>
        {notification.reason && (
          <ReasonQuote
            title={t('notificationWindow.suspensionReasonTitle')}
            reason={notification.reason}
            status={SUSPENDED_STATUS}
          />
        )}
      </div>
    </Modal>
  )
}

export default EstablishmentEventModal
