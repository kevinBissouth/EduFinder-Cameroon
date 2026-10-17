import EstablishmentEventModal from './EstablishmentEventModal'
import SubmissionDetailModal from './SubmissionDetailModal'

export const SUBMISSION_WINDOW = 'submission'
export const ESTABLISHMENT_EVENT_WINDOW = 'establishment-event'

function findSchool(establishments, establishmentUuid) {
  return establishments.find((school) => school.establishment_uuid === establishmentUuid)
}

// La soumission vient de la liste déjà chargée : juste après une décision,
// elle n'y est pas encore à jour, et la fenêtre attend le rechargement plutôt
// que d'afficher un état périmé.
function SubmissionWindow({ openedWindow, managerData, ...handlers }) {
  const submission = managerData.submissions.find(
    (candidate) => candidate.submission_uuid === openedWindow.submissionUuid,
  )
  if (!submission) return null
  return (
    <SubmissionDetailModal
      submission={submission}
      school={findSchool(managerData.establishments, submission.establishment_uuid)}
      meta={managerData.meta}
      {...handlers}
    />
  )
}

function EstablishmentEventWindow({ openedWindow, managerData, ...handlers }) {
  const { notification } = openedWindow
  return (
    <EstablishmentEventModal
      notification={notification}
      school={findSchool(managerData.establishments, notification.establishment_uuid)}
      {...handlers}
    />
  )
}

const WINDOW_BY_TYPE = {
  [SUBMISSION_WINDOW]: SubmissionWindow,
  [ESTABLISHMENT_EVENT_WINDOW]: EstablishmentEventWindow,
}

// La fenêtre de détail ouverte depuis une notification ou depuis la liste des
// soumissions. Elle s'ouvre par-dessus la vue en cours, sans la quitter.
function ManagerDetailWindow({ openedWindow, managerData, onOpenSchool, onClose }) {
  if (!openedWindow) return null
  const Window = WINDOW_BY_TYPE[openedWindow.type]
  return (
    <Window
      openedWindow={openedWindow}
      managerData={managerData}
      onOpenSchool={onOpenSchool}
      onClose={onClose}
    />
  )
}

export default ManagerDetailWindow
