import { useTranslation } from 'react-i18next'

import Modal from '../ui/Modal'
import SchoolWindowFooter from './SchoolWindowFooter'
import ReasonQuote from '../workspace/ReasonQuote'
import SchoolMiniature from '../workspace/SchoolMiniature'
import SubmissionContent from '../workspace/SubmissionContent'
import { SUBMISSION_STATUS_ICONS } from '../workspace/notificationMessages'
import { findStatusTheme } from '../workspace/statusTheme'
import { formatShortDate } from '../../utils/format'

// Le responsable relit ici exactement ce qu'il a proposé, et ce qu'il en est
// advenu. La même fenêtre s'ouvre depuis la liste des soumissions et depuis
// une notification. L'école est absente si elle n'est plus dans ses fiches :
// la fenêtre se passe alors de la miniature et du lien vers la fiche.
function SubmissionDetailModal({ submission, school, meta, onOpenSchool, onClose }) {
  const { t } = useTranslation('manager')
  const status = submission.submission_status
  const submissionType = t(`workspace:submissionType.${submission.submission_type}`, {
    defaultValue: submission.submission_type,
  })

  return (
    <Modal
      icon={SUBMISSION_STATUS_ICONS[status]}
      iconClassName={findStatusTheme(status).markClass}
      title={t(`workspace:submission.verdicts.${status}`)}
      description={t('submissions.typeAndDate', {
        type: submissionType,
        date: formatShortDate(submission.submitted_at),
      })}
      onClose={onClose}
      footer={<SchoolWindowFooter school={school} onOpenSchool={onOpenSchool} onClose={onClose} />}
    >
      <div className="space-y-5">
        {school && <SchoolMiniature school={school} />}
        {submission.rejection_reason && (
          <ReasonQuote
            title={t('workspace:submission.rejectionReasonTitle')}
            reason={submission.rejection_reason}
            status={status}
          />
        )}
        <section>
          <h3 className="mb-2 text-base font-bold text-navy">
            {t('workspace:submission.proposedContent')}
          </h3>
          <SubmissionContent content={submission.content} meta={meta} />
        </section>
      </div>
    </Modal>
  )
}

export default SubmissionDetailModal
