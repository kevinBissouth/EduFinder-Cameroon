import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from '../ui/Button'
import Notice from '../workspace/Notice'
import StatusBadge from '../workspace/StatusBadge'
import SubmissionContent from '../workspace/SubmissionContent'
import ReasonForm from './ReasonForm'
import { formatShortDate } from '../../utils/format'

export function SubmissionSummaryLine({ submission }) {
  const { t } = useTranslation('admin')

  return (
    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
      <span>
        <span className="capitalize">
            {t(`workspace:submissionType.${submission.submission_type}`, {
                defaultValue: submission.submission_type,
            })}
        </span>{' '}
        {t('review.by')}{' '}
        {submission.proposer_name}, {formatShortDate(submission.submitted_at)}
      </span>
      <StatusBadge status={submission.submission_status} />
    </p>
  )
}

function DecisionButtons({ isBusy, onApprove, onStartRejection }) {
  const { t } = useTranslation('admin')

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="secondary" disabled={isBusy} onClick={onStartRejection}>
        <X aria-hidden="true" className="size-4" />
        {t('review.reject')}
      </Button>
      <Button disabled={isBusy} onClick={onApprove}>
        <Check aria-hidden="true" className="size-4" />
        {isBusy ? t('review.saving') : t('review.approve')}
      </Button>
    </div>
  )
}

// Ce qui est proposé, puis la décision. Le même bloc sert dans le panneau du
// tableau de bord et dans la fenêtre : un refus passe toujours par un motif.
function SubmissionReview({ submission, meta, isBusy, errorMessage, onApprove, onReject }) {
  const { t } = useTranslation('admin')
  const [isRejecting, setIsRejecting] = useState(false)
  const isPending = submission.submission_status === 'pending'

  return (
    <>
      {submission.rejection_reason && (
        <Notice tone="danger" className="mb-5">
          {t('review.rejectedNotice', { reason: submission.rejection_reason })}
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
              label={t('review.rejectionReasonLabel')}
              confirmLabel={t('review.rejectSubmission')}
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
