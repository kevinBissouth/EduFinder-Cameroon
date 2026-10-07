import { Ban, CircleCheck, CircleX, Inbox, RotateCcw } from 'lucide-react'

// Le serveur n'envoie que le type d'événement : la phrase est composée ici.
const PRESENTATION_BY_KIND = {
  submission_received: {
    icon: Inbox,
    toneClass: 'bg-primary-soft text-primary-deep',
    describe: (schoolName) => `New submission to review for ${schoolName}.`,
  },
  submission_approved: {
    icon: CircleCheck,
    toneClass: 'bg-primary-soft text-primary-deep',
    describe: (schoolName) => `Your submission for ${schoolName} was approved.`,
  },
  submission_rejected: {
    icon: CircleX,
    toneClass: 'bg-danger-soft text-danger-deep',
    describe: (schoolName) => `Your submission for ${schoolName} was rejected.`,
  },
  establishment_suspended: {
    icon: Ban,
    toneClass: 'bg-warning-soft text-warning',
    describe: (schoolName) => `${schoolName} was suspended and left the public site.`,
  },
  establishment_reactivated: {
    icon: RotateCcw,
    toneClass: 'bg-primary-soft text-primary-deep',
    describe: (schoolName) => `${schoolName} is public again.`,
  },
}

const UNKNOWN_KIND_PRESENTATION = {
  icon: Inbox,
  toneClass: 'bg-muted text-ink',
  describe: (schoolName) => `Update about ${schoolName}.`,
}

export function presentNotification(notification) {
  const presentation = PRESENTATION_BY_KIND[notification.kind] ?? UNKNOWN_KIND_PRESENTATION
  return {
    Icon: presentation.icon,
    toneClass: presentation.toneClass,
    message: presentation.describe(notification.establishment_name),
  }
}
