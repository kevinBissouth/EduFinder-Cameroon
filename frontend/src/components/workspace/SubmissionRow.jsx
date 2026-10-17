import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import MarkedSchoolThumbnail from './MarkedSchoolThumbnail'
import { SUBMISSION_STATUS_ICONS } from './notificationMessages'
import ReasonExcerpt from './ReasonExcerpt'
import SectionChips from './SectionChips'
import { findStatusTheme } from './statusTheme'
import { listChangedSections } from './submissionContent'
import { formatShortDate } from '../../utils/format'

const MODIFICATION_TYPE = 'modification'

// Une soumission dans l'historique, commune aux deux espaces, dans le langage
// de la cloche : la photo de l'école marquée de l'issue, le verdict en
// couleur, le type et les rubriques touchées, l'auteur quand il est connu et
// le début du motif d'un refus. Toute la ligne ouvre le détail.
function SubmissionRow({ submission, coverUrl, actionLabel, actionAriaLabel, onAction }) {
  const { t } = useTranslation('workspace')
  const status = submission.submission_status
  const theme = findStatusTheme(status)
  // Une création touche toutes les rubriques : les lister n'apprendrait rien.
  const changedSections =
    submission.submission_type === MODIFICATION_TYPE ? listChangedSections(submission) : []

  return (
    <li>
      <button
        type="button"
        aria-label={actionAriaLabel}
        onClick={() => onAction(submission)}
        className="group flex h-full w-full cursor-pointer items-start gap-4 rounded-panel border border-line bg-surface p-4 text-left shadow-soft transition-colors hover:border-primary"
      >
        <MarkedSchoolThumbnail
          coverUrl={coverUrl}
          Icon={SUBMISSION_STATUS_ICONS[status]}
          markClass={theme.markClass}
          sizeClass="size-14"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="min-w-0 flex-1 truncate font-bold text-navy">
              {submission.establishment_name}
            </span>
            <span className="shrink-0 text-xs text-ink-soft">
              {formatShortDate(submission.submitted_at)}
            </span>
          </span>
          <span className={`mt-0.5 block text-sm font-semibold ${theme.textClass}`}>
            {t(`submission.verdicts.${status}`)}
          </span>
          <SectionChips sections={changedSections}>
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold capitalize text-primary-deep">
              {t(`submissionType.${submission.submission_type}`, {
                defaultValue: submission.submission_type,
              })}
            </span>
          </SectionChips>
          {submission.proposer_name && (
            <span className="mt-2 block text-xs text-ink">
              {t('submission.proposedBy')}{' '}
              <span className="font-semibold text-navy">{submission.proposer_name}</span>
            </span>
          )}
          {submission.rejection_reason && <ReasonExcerpt reason={submission.rejection_reason} />}
        </span>
        <span className="flex shrink-0 items-center gap-1 self-center text-sm font-semibold text-primary-deep">
          <span className="hidden sm:inline">{actionLabel}</span>
          <ChevronRight
            aria-hidden="true"
            className="size-5 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-primary-deep"
          />
        </span>
      </button>
    </li>
  )
}

export default SubmissionRow
