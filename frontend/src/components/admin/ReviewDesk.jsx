import { useEffect } from 'react'
import { ChevronRight, CircleCheck } from 'lucide-react'

import SubmissionReview, { SubmissionSummaryLine } from './SubmissionReview'
import ScrollArea from '../workspace/ScrollArea'
import { formatRelativeTime } from '../../utils/format'

function QueueItem({ submission, isSelected, onOpen }) {
  return (
    <li>
      <button
        type="button"
        aria-current={isSelected ? 'true' : undefined}
        onClick={() => onOpen(submission.submission_uuid)}
        className={`flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-control px-3 py-2 text-left transition-colors ${
          isSelected ? 'bg-primary-soft' : 'hover:bg-muted'
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-navy">
            {submission.establishment_name}
          </span>
          <span className="block text-xs text-ink-soft">
            <span className="capitalize">{submission.submission_type}</span> by{' '}
            {submission.proposer_name}, {formatRelativeTime(submission.submitted_at)}
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
      </button>
    </li>
  )
}

function EmptyQueue() {
  return (
    <section className="flex items-center gap-4 rounded-panel bg-linear-to-br from-primary-deep to-violet-deep p-6 text-white sm:p-8">
      <CircleCheck aria-hidden="true" className="size-10 shrink-0 text-accent" />
      <div>
        <h2 className="font-display text-3xl leading-display">Nothing to decide</h2>
        <p className="mt-1 text-sm text-on-navy-soft text-pretty">
          Every submission has a decision. New ones appear here and in your notifications.
        </p>
      </div>
    </section>
  )
}

// Poste de validation : la file des soumissions en attente, la plus ancienne
// d'abord, et sur bureau la soumission ouverte à côté pour décider sans
// quitter l'écran. Sur téléphone, la page l'ouvre en fenêtre.
function ReviewDesk({
  pendingSubmissions,
  openedSubmission,
  isAnySubmissionOpened,
  showsInlineReview,
  reviewProps,
  onOpenSubmission,
}) {
  // L'API renvoie les plus récentes d'abord : celle qui attend depuis le plus
  // longtemps passe en tête.
  const queue = [...pendingSubmissions].reverse()
  const firstQueuedUuid = queue[0]?.submission_uuid

  // Sur bureau le panneau de droite n'est jamais vide : la première de la
  // file s'ouvre d'elle-même, puis la suivante après chaque décision.
  useEffect(() => {
    if (showsInlineReview && !isAnySubmissionOpened && firstQueuedUuid) {
      onOpenSubmission(firstQueuedUuid)
    }
  }, [showsInlineReview, isAnySubmissionOpened, firstQueuedUuid, onOpenSubmission])

  if (queue.length === 0) return <EmptyQueue />

  return (
    <section className="grid grid-cols-1 overflow-hidden rounded-panel border border-line bg-surface shadow-soft lg:h-[30rem] lg:grid-cols-5">
      <div className="flex h-[26rem] min-h-0 flex-col bg-linear-to-br from-primary-deep to-violet-deep p-5 text-white [--focus-ring:var(--color-accent)] sm:p-6 lg:col-span-2 lg:h-auto">
        <p className="font-display text-5xl leading-display tabular-nums">{queue.length}</p>
        <h2 className="mt-1 text-lg font-bold">
          {queue.length === 1 ? 'submission awaiting your review' : 'submissions awaiting your review'}
        </h2>
        <p className="mt-1 text-sm text-on-navy-soft">The one that has waited longest comes first.</p>
        <div className="mt-5 flex min-h-0 flex-1 flex-col rounded-control bg-surface p-1">
          <ScrollArea label="Submissions awaiting review">
            <ul className="space-y-1">
              {queue.map((submission) => (
                <QueueItem
                  key={submission.submission_uuid}
                  submission={submission}
                  isSelected={submission.submission_uuid === openedSubmission?.submission_uuid}
                  onOpen={onOpenSubmission}
                />
              ))}
            </ul>
          </ScrollArea>
        </div>
      </div>
      {showsInlineReview && (
        <div className="min-h-0 min-w-0 overflow-y-auto p-6 lg:col-span-3">
          {openedSubmission ? (
            <>
              <h3 className="font-display text-2xl text-navy text-balance">
                {openedSubmission.establishment_name}
              </h3>
              <SubmissionSummaryLine submission={openedSubmission} />
              <div className="mt-5">
                <SubmissionReview
                  key={openedSubmission.submission_uuid}
                  submission={openedSubmission}
                  {...reviewProps}
                />
              </div>
            </>
          ) : (
            <p role="status" className="py-16 text-center text-sm text-ink-soft">
              Loading the submission…
            </p>
          )}
        </div>
      )}
    </section>
  )
}

export default ReviewDesk
