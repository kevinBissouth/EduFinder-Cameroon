import { useState } from 'react'
import { FileText } from 'lucide-react'

import StateMessage from '../ui/StateMessage'
import PagedCards from '../workspace/PagedCards'
import SubmissionCard from '../workspace/SubmissionCard'
import ViewHero from '../workspace/ViewHero'
import SubmissionDetailModal from './SubmissionDetailModal'
import { countSubmissionsByStatus } from './submissionCounts'
import { formatShortDate } from '../../utils/format'

function describeSubmissionCount(submissions) {
  const submissionWord = submissions.length === 1 ? 'change' : 'changes'
  return `You proposed ${submissions.length} ${submissionWord}. Each one is reviewed by a super administrator before it goes public.`
}

function buildOutcomeFigures(submissions) {
  return [
    { label: 'approved', value: countSubmissionsByStatus(submissions, 'approved') },
    { label: 'awaiting review', value: countSubmissionsByStatus(submissions, 'pending') },
    { label: 'rejected', value: countSubmissionsByStatus(submissions, 'rejected') },
  ]
}

// Historique des propositions du responsable, les plus récentes d'abord
// (l'ordre vient de l'API). Chaque carte reprend la photo de l'établissement
// concerné, retrouvée dans la liste des établissements gérés.
function SubmissionsList({ submissions, establishments, meta }) {
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const coverUrlBySchool = new Map(
    establishments.map((school) => [school.establishment_uuid, school.cover_url]),
  )

  if (submissions.length === 0) {
    return (
      <StateMessage
        icon={FileText}
        title="No submission yet"
        description="Propose a school or a change to one of your schools. Its review status appears here."
      />
    )
  }

  return (
    <>
      <ViewHero
        title="Your submissions"
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
            actionLabel="View what was proposed"
            actionAriaLabel={`View what was proposed for ${submission.establishment_name} on ${formatShortDate(submission.submitted_at)}`}
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
