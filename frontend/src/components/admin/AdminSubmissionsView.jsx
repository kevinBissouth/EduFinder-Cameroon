import PagedCards from '../workspace/PagedCards'
import SubmissionCard from '../workspace/SubmissionCard'
import ViewHero from '../workspace/ViewHero'
import { formatShortDate } from '../../utils/format'

const ALL_STATUSES = 'all'
const STATUS_FILTERS = [
  { id: 'pending', label: 'Awaiting review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: ALL_STATUSES, label: 'All' },
]

function countByStatus(submissions, submissionStatus) {
  return submissions.filter((submission) => submission.submission_status === submissionStatus)
    .length
}

function StatusFilters({ activeFilter, onFilterChange }) {
  return (
    <div role="group" aria-label="Submission status" className="mb-6 flex flex-wrap gap-2">
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
            {statusFilter.label}
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
        title="Submissions"
        description="What school managers propose. Nothing reaches the public site before you approve it."
        figures={[
          { value: countByStatus(submissions, 'pending'), label: 'awaiting review' },
          { value: countByStatus(submissions, 'approved'), label: 'approved' },
          { value: countByStatus(submissions, 'rejected'), label: 'rejected' },
        ]}
      />
      <StatusFilters activeFilter={activeFilter} onFilterChange={onFilterChange} />
      {shownSubmissions.length === 0 ? (
        <p className="rounded-panel border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-soft">
          No submission with this status.
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
              actionLabel="Review"
              actionAriaLabel={`Review the submission for ${submission.establishment_name} of ${formatShortDate(submission.submitted_at)}`}
              onAction={(openedSubmission) => onOpenSubmission(openedSubmission.submission_uuid)}
            />
          )}
        />
      )}
    </>
  )
}

export default AdminSubmissionsView
