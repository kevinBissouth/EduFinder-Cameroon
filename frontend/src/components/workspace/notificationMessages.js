import { Ban, CircleCheck, CircleX, Inbox, RotateCcw } from 'lucide-react'
import i18next from 'i18next'

// Le serveur n'envoie que le type d'événement : la phrase est composée ici,
// dans la langue affichée.
const PRESENTATION_BY_KIND = {
  submission_received: {
    icon: Inbox,
    toneClass: 'bg-primary-soft text-primary-deep',
    messageKey: 'workspace:notifications.kinds.submission_received',
  },
  submission_approved: {
    icon: CircleCheck,
    toneClass: 'bg-primary-soft text-primary-deep',
    messageKey: 'workspace:notifications.kinds.submission_approved',
  },
  submission_rejected: {
    icon: CircleX,
    toneClass: 'bg-danger-soft text-danger-deep',
    messageKey: 'workspace:notifications.kinds.submission_rejected',
  },
  establishment_suspended: {
    icon: Ban,
    toneClass: 'bg-warning-soft text-warning',
    messageKey: 'workspace:notifications.kinds.establishment_suspended',
  },
  establishment_reactivated: {
    icon: RotateCcw,
    toneClass: 'bg-primary-soft text-primary-deep',
    messageKey: 'workspace:notifications.kinds.establishment_reactivated',
  },
}

const UNKNOWN_KIND_PRESENTATION = {
  icon: Inbox,
  toneClass: 'bg-muted text-ink',
  messageKey: 'workspace:notifications.kinds.unknown',
}

export function presentNotification(notification) {
  const presentation = PRESENTATION_BY_KIND[notification.kind] ?? UNKNOWN_KIND_PRESENTATION
  return {
    Icon: presentation.icon,
    toneClass: presentation.toneClass,
    message: i18next.t(presentation.messageKey, { school: notification.establishment_name }),
  }
}
