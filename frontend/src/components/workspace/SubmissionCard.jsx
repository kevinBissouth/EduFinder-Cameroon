import { CalendarDays } from 'lucide-react'

import Button from '../ui/Button'
import SchoolCover from './SchoolCover'
import { formatShortDate } from '../../utils/format'

// Carte d'une soumission, commune aux deux espaces : la photo et le nom de
// l'établissement, le type et la date, l'auteur quand il est connu, le motif
// d'un refus, puis l'action de l'espace (relire ou décider).
function SubmissionCard({ submission, coverUrl, actionLabel, actionAriaLabel, onAction }) {
  return (
    <li className="group flex h-full flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-soft transition-shadow hover:shadow-raised">
      <SchoolCover
        name={submission.establishment_name}
        coverUrl={coverUrl}
        status={submission.submission_status}
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold capitalize text-primary-deep">
            {submission.submission_type}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-ink">
            <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-primary" />
            {formatShortDate(submission.submitted_at)}
          </span>
        </div>
        {submission.proposer_name && (
          <p className="mt-3 text-sm text-ink">
            Proposed by <span className="font-semibold text-navy">{submission.proposer_name}</span>
          </p>
        )}
        {submission.rejection_reason && (
          <p className="mt-3 line-clamp-3 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger-deep">
            Reason: {submission.rejection_reason}
          </p>
        )}
        <div className="mt-auto pt-5">
          <Button
            variant="secondary"
            className="w-full"
            aria-label={actionAriaLabel}
            onClick={() => onAction(submission)}
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </li>
  )
}

export default SubmissionCard
