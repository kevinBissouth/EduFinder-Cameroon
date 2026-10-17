import { Ban, CircleCheck, CircleX, Hourglass, Inbox, RotateCcw } from 'lucide-react'
import i18next from 'i18next'

import { findStatusTheme } from './statusTheme'

// Icône de chaque état d'une soumission, partagée par la cloche et par la
// fenêtre de la soumission.
export const SUBMISSION_STATUS_ICONS = {
  pending: Hourglass,
  approved: CircleCheck,
  rejected: CircleX,
}

// Le serveur n'envoie que le type d'événement : le verdict est composé ici,
// dans la langue affichée. Chaque événement prend la couleur de l'état qu'il
// annonce, la même que partout ailleurs dans les espaces privés.
const PRESENTATION_BY_KIND = {
  submission_received: { icon: Inbox, status: 'pending' },
  submission_approved: { icon: SUBMISSION_STATUS_ICONS.approved, status: 'approved' },
  submission_rejected: { icon: SUBMISSION_STATUS_ICONS.rejected, status: 'rejected' },
  establishment_suspended: { icon: Ban, status: 'suspended' },
  establishment_reactivated: { icon: RotateCcw, status: 'published' },
}

const UNKNOWN_KIND = 'unknown'
const UNKNOWN_KIND_PRESENTATION = { icon: Inbox, status: UNKNOWN_KIND }

export function presentNotification(notification) {
  const knownKind = notification.kind in PRESENTATION_BY_KIND ? notification.kind : UNKNOWN_KIND
  const presentation = PRESENTATION_BY_KIND[knownKind] ?? UNKNOWN_KIND_PRESENTATION
  const theme = findStatusTheme(presentation.status)
  return {
    Icon: presentation.icon,
    markClass: theme.markClass,
    verdictClass: theme.textClass,
    verdict: i18next.t(`workspace:notifications.verdicts.${knownKind}`),
  }
}
