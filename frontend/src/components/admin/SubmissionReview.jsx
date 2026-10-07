import { useState } from 'react'
import { Check, X } from 'lucide-react'

import Button from '../ui/Button'
import Notice from '../workspace/Notice'
import StatusBadge from '../workspace/StatusBadge'
import SubmissionContent from '../workspace/SubmissionContent'
import ReasonForm from './ReasonForm'
import { formatShortDate } from '../../utils/format'

export function SubmissionSummaryLine({ submission }) {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
      <span>
        <span className="capitalize">{submission.submission_type}</span> by{' '}
        {submission.proposer_name}, {formatShortDate(submission.submitted_at)}
      </span>
      <StatusBadge status={submission.submission_status} />
    </p>
  )
}

function DecisionButtons({ isBusy, onApprove, onStartRejection }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="secondary" disabled={isBusy} onClick={onStartRejection}>
        <X aria-hidden="true" className="size-4" />
        Reject
      </Button>
      <Button disabled={isBusy} onClick={onApprove}>
        <Check aria-hidden="true" className="size-4" />
        {isBusy ? 'Saving…' : 'Approve'}
      </Button>
    </div>
  )
}

// Ce qui est proposé, puis la décision. Le même bloc sert dans le panneau du
// tableau de bord et dans la fenêtre : un refus passe toujours par un motif.
function SubmissionReview({ submission, meta, isBusy, errorMessage, onApprove, onReject }) {
  const [isRejecting, setIsRejecting] = useState(false)
  const isPending = submission.submission_status === 'pending'

  return (
    <>
      {submission.rejection_reason && (
        <Notice tone="danger" className="mb-5">
          Rejected: {submission.rejection_reason}
        </Notice>
      )}
      <SubmissionContent content={submission.content} meta={meta} />
      {errorMessage && (
        <Notice tone="danger" className="mt-5">
          {errorMessage}
        </Notice>
      )}
      {isPending && (
        <div className="mt-6 border-t border-line pt-5">
          {isRejecting ? (
            <ReasonForm
              label="Reason for the rejection (the manager will read it)"
              confirmLabel="Reject the submission"
              isBusy={isBusy}
              onConfirm={onReject}
              onCancel={() => setIsRejecting(false)}
            />
          ) : (
            <DecisionButtons
              isBusy={isBusy}
              onApprove={onApprove}
              onStartRejection={() => setIsRejecting(true)}
            />
          )}
        </div>
      )}
    </>
  )
}

export default SubmissionReview
