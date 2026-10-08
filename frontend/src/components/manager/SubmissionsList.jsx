import { useState } from 'react'
import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'

import StateMessage from '../ui/StateMessage'
import PagedCards from '../workspace/PagedCards'
import SubmissionCard from '../workspace/SubmissionCard'
import ViewHero from '../workspace/ViewHero'
import SubmissionDetailModal from './SubmissionDetailModal'
import { countSubmissionsByStatus } from './submissionCounts'
import { formatShortDate } from '../../utils/format'

function describeSubmissionCount(submissions) {
  return i18next.t('manager:submissions.summary', { count: submissions.length })
}

// Chaque pastille accorde son libellé avec son propre nombre.
function buildOutcomeFigure(submissions, status, labelKey) {
  const count = countSubmissionsByStatus(submissions, status)
  return { label: i18next.t(labelKey, { count }), value: count }
}

function buildOutcomeFigures(submissions) {
  return [
    buildOutcomeFigure(submissions, 'approved', 'manager:submissions.approved'),
    buildOutcomeFigure(submissions, 'pending', 'manager:submissions.awaiting'),
    buildOutcomeFigure(submissions, 'rejected', 'manager:submissions.rejected'),
  ]
}

// Historique des propositions du responsable, les plus récentes d'abord
// (l'ordre vient de l'API). Chaque carte reprend la photo de l'établissement
// concerné, retrouvée dans la liste des établissements gérés.
function SubmissionsList({ submissions, establishments, meta }) {
  const { t } = useTranslation('manager')
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const coverUrlBySchool = new Map(
    establishments.map((school) => [school.establishment_uuid, school.cover_url]),
  )

  if (submissions.length === 0) {
    return (
      <StateMessage
        icon={FileText}
        title={t('submissions.emptyTitle')}
        description={t('submissions.emptyDescription')}
      />
    )
  }

  return (
    <>
      <ViewHero
        title={t('submissions.title')}
        description={describeSubmissionCount(submissions)}
        figures={buildOutcomeFigures(submissions)}
      />
      <PagedCards
        items={submissions}
        renderCard={(submission) => (
          <SubmissionCard
            key={submission.submission_uuid}
            submission={submission}
            coverUrl={coverUrlBySchool.get(submission.establishment_uuid)}
            actionLabel={t('submissions.view')}
            actionAriaLabel={t('submissions.viewNamed', {
              school: submission.establishment_name,
              date: formatShortDate(submission.submitted_at),
            })}
            onAction={setSelectedSubmission}
          />
        )}
      />
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          meta={meta}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </>
  )
}

export default SubmissionsList
