import { useTranslation } from 'react-i18next'

import Button from '../ui/Button'
import Modal from '../workspace/Modal'
import Notice from '../workspace/Notice'
import StatusBadge from '../workspace/StatusBadge'
import SubmissionContent from '../workspace/SubmissionContent'
import { formatShortDate } from '../../utils/format'

// Le responsable relit ici exactement ce qu'il a proposé.
function SubmissionDetailModal({ submission, meta, onClose }) {
  const { t } = useTranslation('manager')
  const headerExtra = (
    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
      <span className="capitalize">{submission.submission_type}</span>
      <span>{t('submissions.submittedOn', { date: formatShortDate(submission.submitted_at) })}</span>
      <StatusBadge status={submission.submission_status} />
    </p>
  )

  return (
    <Modal
      title={submission.establishment_name}
      headerExtra={headerExtra}
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
          {t('actions.close')}
        </Button>
      }
    >
      {submission.rejection_reason && (
        <Notice tone="danger" className="mb-5">
          Rejected: {submission.rejection_reason}
        </Notice>
      )}
      <SubmissionContent content={submission.content} meta={meta} />
    </Modal>
  )
}

export default SubmissionDetailModal
