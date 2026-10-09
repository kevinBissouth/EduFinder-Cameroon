import { useTranslation } from 'react-i18next'
import i18next from 'i18next'

import PagedCards from '../workspace/PagedCards'
import SubmissionCard from '../workspace/SubmissionCard'
import ViewHero from '../workspace/ViewHero'
import { formatShortDate } from '../../utils/format'

const ALL_STATUSES = 'all'
const PENDING_STATUS = 'pending'
const STATUS_FILTERS = [
  { id: 'pending', labelKey: 'submissions.filterPending' },
  { id: 'approved', labelKey: 'submissions.filterApproved' },
  { id: 'rejected', labelKey: 'submissions.filterRejected' },
  { id: ALL_STATUSES, labelKey: 'submissions.filterAll' },
]

function countByStatus(submissions, submissionStatus) {
  return submissions.filter((submission) => submission.submission_status === submissionStatus)
    .length
}

// Chaque pastille accorde son libellé avec son propre nombre.
function buildStatusFigure(submissions, submissionStatus, labelKey) {
  const count = countByStatus(submissions, submissionStatus)
  return { value: count, label: i18next.t(labelKey, { count }) }
}

function StatusFilters({ activeFilter, onFilterChange }) {
  const { t } = useTranslation('admin')

  return (
    <div role="group" aria-label={t('submissions.statusGroup')} className="mb-6 flex flex-wrap gap-2">
      {STATUS_FILTERS.map((statusFilter) => {
        const isActive = statusFilter.id === activeFilter
        return (
          <button
            key={statusFilter.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onFilterChange(statusFilter.id)}
            className={`min-h-11 cursor-pointer rounded-full border px-4 text-sm font-semibold transition-colors ${
              isActive
                ? 'border-primary-deep bg-primary-deep text-white'
                : 'border-line bg-surface text-navy hover:border-primary hover:text-primary-deep'
            }`}
          >
            {t(statusFilter.labelKey)}
          </button>
        )
      })}
    </div>
  )
}

// Toutes les soumissions de la plateforme, filtrables par état. Chaque carte
// reprend la photo de l'établissement concerné, retrouvée dans la liste des
// établissements.
function AdminSubmissionsView({
  submissions,
  establishments,
  activeFilter,
  onFilterChange,
  onOpenSubmission,
}) {
  const { t } = useTranslation('admin')
  const coverUrlBySchool = new Map(
    establishments.map((school) => [school.establishment_uuid, school.cover_url]),
  )
  const shownSubmissions =
    activeFilter === ALL_STATUSES
      ? submissions
      : submissions.filter((submission) => submission.submission_status === activeFilter)

  return (
    <>
      <ViewHero
        title={t('submissions.title')}
        description={t('submissions.description')}
        figures={[
          buildStatusFigure(submissions, 'pending', 'admin:submissions.awaiting'),
          buildStatusFigure(submissions, 'approved', 'admin:submissions.approved'),
          buildStatusFigure(submissions, 'rejected', 'admin:submissions.rejected'),
        ]}
      />
      <StatusFilters activeFilter={activeFilter} onFilterChange={onFilterChange} />
      {shownSubmissions.length === 0 ? (
        <p className="rounded-panel border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-soft">
          {t('submissions.empty')}
        </p>
      ) : (
        // La clé remet la pagination à la première page quand le filtre change.
        <PagedCards
          key={activeFilter}
          items={shownSubmissions}
          renderCard={(submission) => (
            <SubmissionCard
              key={submission.submission_uuid}
              submission={submission}
              coverUrl={coverUrlBySchool.get(submission.establishment_uuid)}
              actionLabel={
                submission.submission_status === PENDING_STATUS
                  ? t('submissions.review')
                  : t('workspace:submission.view')
              }
              actionAriaLabel={t('submissions.reviewNamed', {
                school: submission.establishment_name,
                date: formatShortDate(submission.submitted_at),
              })}
              onAction={(openedSubmission) => onOpenSubmission(openedSubmission.submission_uuid)}
            />
          )}
        />
      )}
    </>
  )
}

export default AdminSubmissionsView
