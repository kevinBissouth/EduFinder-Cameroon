import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'

import Button from '../ui/Button'
import { TextField } from '../ui/Field'
import PagedCards from '../workspace/PagedCards'
import ViewHero from '../workspace/ViewHero'
import SchoolSection from './SchoolSection'
import { findLatestYear } from './schoolYears'
import { useModificationProposal } from '../../hooks/useModificationProposal'
import { formatPercent } from '../../utils/format'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'

const MAX_PASS_RATE = 100

function isSameResult(firstResult, secondResult) {
  return (
    firstResult?.id_exam === secondResult.id_exam && firstResult?.session === secondResult.session
  )
}

function PassRateEditor({ examResult, isSubmitting, onSubmit, onCancel }) {
  const { t } = useTranslation('manager')
  const translateReference = useReferenceLabel()
  const [passRateDraft, setPassRateDraft] = useState(String(Number(examResult.pass_rate)))

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(Number(passRateDraft))
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-control bg-paper p-4">
      <TextField
        label={t('exams.rateLabel', {
          exam: translateReference('exams', examResult.exam),
          session: examResult.session,
        })}
        type="number"
        min="0"
        max={MAX_PASS_RATE}
        step="any"
        autoFocus
        value={passRateDraft}
        onChange={(event) => setPassRateDraft(event.target.value)}
        className="sm:max-w-xs"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {t('actions.sendForReview')}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('actions.cancel')}
        </Button>
      </div>
    </form>
  )
}

const LATEST_SESSION_HEADER_CLASS = 'bg-linear-to-br from-primary-deep to-violet-deep'
const OLDER_SESSION_HEADER_CLASS = 'bg-ink-soft'

// Carte d'un résultat : un en-tête coloré avec l'examen et sa session (en
// dégradé pour la session la plus récente, gris pour les précédentes), puis
// le taux en grand, doublé d'une jauge.
function ExamResultCard({ examResult, isLatestSession, isEditing, onEdit, children }) {
  const { t } = useTranslation('manager')
  const translateReference = useReferenceLabel()

  return (
    <li className="flex h-full flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-soft">
      <div
        className={`flex items-start justify-between gap-3 p-5 text-white ${
          isLatestSession ? LATEST_SESSION_HEADER_CLASS : OLDER_SESSION_HEADER_CLASS
        }`}
      >
        <h3 className="min-w-0 font-display text-2xl leading-display">{translateReference('exams', examResult.exam)}</h3>
        <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          {examResult.session}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold text-ink-soft">Pass rate</p>
        <p className="mt-1 font-display text-4xl leading-display text-navy tabular-nums">
          {formatPercent(examResult.pass_rate)}
        </p>
        <div aria-hidden="true" className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Number(examResult.pass_rate)}%` }}
          />
        </div>
        {children}
        {!isEditing && (
          <div className="mt-auto pt-5">
            <Button
              variant="secondary"
              aria-label={t('exams.editRate', {
                exam: translateReference('exams', examResult.exam),
                session: examResult.session,
              })}
              onClick={onEdit}
            >
              <Pencil aria-hidden="true" className="size-4" />
              {t('actions.edit')}
            </Button>
          </div>
        )}
      </div>
    </li>
  )
}

function buildExamFigures(examResults, latestSession) {
  if (examResults.length === 0) return []

  const sessionCount = new Set(examResults.map((examResult) => examResult.session)).size
  const bestPassRate = Math.max(...examResults.map((examResult) => Number(examResult.pass_rate)))
  return [
    {
      value: sessionCount,
      label: i18next.t('manager:exams.sessionsRecorded', { count: sessionCount }),
    },
    { value: latestSession, label: i18next.t('manager:exams.latestSession') },
    { value: formatPercent(bestPassRate), label: i18next.t('manager:exams.bestPassRate') },
  ]
}

function ExamResultsContent({ detail, onProposalSubmitted }) {
  const { t } = useTranslation('manager')
  const [editedResult, setEditedResult] = useState(null)
  const [areAllSessionsShown, setAreAllSessionsShown] = useState(false)
  const proposal = useModificationProposal(detail.uuid, onProposalSubmitted)

  const examResults = detail.exam_results
  const latestSession = findLatestYear(examResults.map((examResult) => examResult.session))
  const hasOlderSessions = examResults.some((examResult) => examResult.session !== latestSession)
  const shownResults = areAllSessionsShown
    ? examResults
    : examResults.filter((examResult) => examResult.session === latestSession)

  async function submitPassRate(examResult, passRate) {
    if (!Number.isFinite(passRate) || passRate < 0 || passRate > MAX_PASS_RATE) {
      proposal.showError(t('exams.rateRange', { maximum: MAX_PASS_RATE }))
      return
    }
    const isSent = await proposal.submitProposal({
      exam_results: [
        { id_exam: examResult.id_exam, session: examResult.session, pass_rate: String(passRate) },
      ],
    })
    if (isSent) setEditedResult(null)
  }

  const sessionToggle = hasOlderSessions && (
    <Button
      variant="inverse"
      className="w-full sm:w-auto"
      onClick={() => setAreAllSessionsShown(!areAllSessionsShown)}
    >
      {areAllSessionsShown ? t('exams.showLatest') : t('exams.showAll')}
    </Button>
  )

  return (
    <>
      <ViewHero
        title={t('exams.title')}
        description={t('exams.description', { school: detail.name })}
        figures={buildExamFigures(examResults, latestSession)}
        action={sessionToggle}
      />
      {examResults.length === 0 ? (
        <p className="rounded-panel border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-soft">
          {t('exams.empty')}
        </p>
      ) : (
        // La clé remet la pagination à la première page quand on change de sessions affichées.
        <PagedCards
          key={String(areAllSessionsShown)}
          items={shownResults}
          renderCard={(examResult) => {
            const isEditing = isSameResult(editedResult, examResult)
            return (
              <ExamResultCard
                key={`${examResult.id_exam}-${examResult.session}`}
                examResult={examResult}
                isLatestSession={examResult.session === latestSession}
                isEditing={isEditing}
                onEdit={() => setEditedResult(examResult)}
              >
                {isEditing && (
                  <PassRateEditor
                    examResult={examResult}
                    isSubmitting={proposal.isSubmitting}
                    onSubmit={(passRate) => submitPassRate(examResult, passRate)}
                    onCancel={() => setEditedResult(null)}
                  />
                )}
              </ExamResultCard>
            )
          }}
        />
      )}
    </>
  )
}

function ManagerExamResultsView({ onProposalSubmitted, ...sectionProps }) {
  return (
    <SchoolSection {...sectionProps}>
      {(detail) => (
        <ExamResultsContent
          key={detail.uuid}
          detail={detail}
          onProposalSubmitted={onProposalSubmitted}
        />
      )}
    </SchoolSection>
  )
}

export default ManagerExamResultsView
