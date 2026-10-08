import { ClipboardList } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import ChartCard from '../../charts/ChartCard'
import ShareBar from '../../charts/ShareBar'
import Button from '../../ui/Button'
import ScrollArea from '../../workspace/ScrollArea'
import StatusBadge from '../../workspace/StatusBadge'
import { findStatusTheme } from '../../workspace/statusTheme'
import { countSubmissionsByStatus } from '../submissionCounts'
import { formatShortDate } from '../../../utils/format'

const OUTCOMES = [
  { status: 'approved', labelKey: 'workspace:charts.approved' },
  { status: 'pending', labelKey: 'workspace:charts.pending' },
  { status: 'rejected', labelKey: 'workspace:charts.rejected' },
]

// Où en sont les soumissions de l'établissement : leur répartition par
// issue, puis leur liste, qui défile dans le bloc.
function SubmissionPipeline({ submissions, onViewAll }) {
  const { t } = useTranslation('manager')
  const segments = OUTCOMES.map((outcome) => ({
    label: t(outcome.labelKey),
    color: findStatusTheme(outcome.status).chartColor,
    value: countSubmissionsByStatus(submissions, outcome.status),
  }))

  return (
    <ChartCard
      icon={ClipboardList}
      tone="blue"
      title={t('dashboard.submissionsTitle')}
      description={t('dashboard.submissionsDescription')}
      count={submissions.length}
      status={submissions.length === 0 ? 'empty' : 'ready'}
      emptyMessage={t('dashboard.submissionsEmpty')}
      action={
        <Button variant="ghost" onClick={onViewAll}>
          {t('dashboard.viewAll')}
        </Button>
      }
    >
      <ShareBar segments={segments} />
      <ScrollArea label={t('dashboard.submissionsTitle')} className="mt-4">
        <ul className="divide-y divide-line">
          {submissions.map((submission) => (
            <li
              key={submission.submission_uuid}
              className="flex items-center justify-between gap-3 py-3 first:pt-0"
            >
              <p className="text-sm text-ink">
                <span className="font-semibold capitalize text-navy">
                  {t(`workspace:submissionType.${submission.submission_type}`, {
                    defaultValue: submission.submission_type,
                  })}
                </span>
                , {formatShortDate(submission.submitted_at)}
              </p>
              <StatusBadge status={submission.submission_status} />
            </li>
          ))}
        </ul>
      </ScrollArea>
    </ChartCard>
  )
}

export default SubmissionPipeline
