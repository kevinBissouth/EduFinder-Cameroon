import Modal from '../ui/Modal'
import SubmissionReview, { SubmissionSummaryLine } from './SubmissionReview'

function SubmissionReviewModal({ submission, onClose, ...reviewProps }) {
  return (
    <Modal
      title={submission.establishment_name}
      headerExtra={<SubmissionSummaryLine submission={submission} />}
      onClose={onClose}
    >
      <SubmissionReview submission={submission} {...reviewProps} />
    </Modal>
  )
}

export default SubmissionReviewModal
