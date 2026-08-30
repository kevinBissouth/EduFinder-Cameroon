import { useState } from "react"
import { Building2, Check, Lock, Pencil, X } from "lucide-react"
import { SHADOW_CARD } from "./dashTokens"
import { authedRequest } from '../../utils/auth'
// Année en courante = la plus récente présente dans les résultats d'examens
// (les années précédentes restent en lecture seule).
const pickCurrentYear = (examResults) =>
  examResults.length
    ? [...examResults.map((r) => r.session)].sort().at(-1)
    : null

// Vue « Exam Results » du responsable : autonome, sans redirection. Le
// sélecteur d'établissement (chips) filtre le contenu sur place quand le
// responsable gère plusieurs écoles.
export default function ManagerExamResultsView({
  establishments,
  selectedUuid,
  onSelectSchool,
  detail,
  detailStatus,
  reloadDetail,
}) {
  // --- État du composant ---
  const [editingKey, setEditingKey] = useState(null) // chaîne "id_exam-session"
  const [draftPassRate, setDraftPassRate] = useState('')
  const [notice, setNotice] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // --- État d'affichage des sessions ---
  const [ showAllSessions, setShowAllSessions ] = useState(false)

  if (establishments.length === 0) {
    return (
      <div className="rounded-[20px] border border-[#e7ece9] bg-white p-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4f0] text-[#0d7a4f]">
          <Building2 size={26} />
        </span>
        <p className="mt-4 font-display text-xl font-bold text-[#081220]">No school yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-[#5b6670]">
          Propose your first establishment — once approved, you can manage its exam results here.
        </p>
      </div>
    )
  }

  if (detailStatus === 'loading' && !detail) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-[#8a90a0]">
        Loading exam results…
      </div>
    )
  }
  if (detailStatus === 'error' || !detail) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        Unable to load your exam results. Make sure the server is running, then refresh.
      </div>
    )
  }

  const examResults = detail.exam_results
  const currentYear = pickCurrentYear(examResults)
  const hasPendingSubmission = detail.has_pending_submission

  // Résultats affichés : par défaut uniquement la session en cours ;
  // le bouton "Voir plus" bascule l'affichage.
  const displayedResults = showAllSessions
    ? examResults
    : examResults.filter((r) => r.session === currentYear)

  // --- Gestion de l'édition en cours ---
  const startEditing = (key) => {
    if (hasPendingSubmission) return
    setEditingKey(key)
    setDraftPassRate('')
  }

  const cancelEditing = () => {
    setEditingKey(null)
    setDraftPassRate('')
    setNotice(null)
    setSubmitError(null)
  }

  const submitProposal = async () => {
    const rate = Number(draftPassRate)
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      setSubmitError('Enter a pass rate between 0 and 100.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await authedRequest('post', `/my/establishments/${detail.uuid}/modification-proposals`, {
        exam_results: [
          {
            id_exam: Number(editingKey.split('-')[0]),
            session: editingKey.split('-')[1],
            pass_rate: String(rate),
          },
        ],
      })
      setNotice('Exam result submitted for review.')
      setEditingKey(null)
      setDraftPassRate('')
      reloadDetail()
    } catch (error) {
      if (error.response?.status === 409) {
        setSubmitError('A modification is already pending for this school.')
    } else {
      setSubmitError('Unable to submit — check the pass rate and try again.')
    }
    } finally {
      setSubmitting(false)
    }
  }

  if (examResults.length === 0) {
    return (
      <p className="rounded-2xl bg-[#f6faf8] px-4 py-4 text-[13px] text-[#8a90a0]">
        No exam results set yet — add them so families can compare.
      </p>
    )
  }

  return (
    <div>
      {/* Bloc titre + sélecteur d'établissement inline */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[22px] font-bold tracking-tight text-[#081220]">
            Exam Results
          </h2>
          <p className="mt-1 text-[13px] text-[#5b6670]">
            National exam pass rates for your establishments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {establishments.length > 1 && (
            <>
              {establishments.map((school) => {
                const isActive = school.establishment_uuid === selectedUuid
                return (
                  <button
                    key={school.establishment_uuid}
                    onClick={() => onSelectSchool(school.establishment_uuid)}
                    className={
                      isActive
                        ? 'inline-flex items-center gap-1.5 rounded-full bg-[#0d7a4f] px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(13,122,79,0.25)]'
                        : 'inline-flex items-center gap-1.5 rounded-full border border-[#dcebe3] bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#343a44] transition-colors hover:border-[#0d7a4f] hover:text-[#0d7a4f]'
                    }
                  >
                    <Building2 size={13} />
                    <span className="truncate">{school.name}</span>
                  </button>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* Quatre cartes de synthèse du dashboard — intégrées par le parent
          (ManagerHomePage) pour rester identiques au dashboard. */}

      {/* Tableau des résultats (dominant) */}
      <section className={`mt-[18px] overflow-auto rounded-[18px] border border-[#e7ece9] bg-white p-4 ${SHADOW_CARD}`}>
        {hasPendingSubmission && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdf3dd] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#8a5b00]">
            <Lock size={11} /> Locked while a proposal is pending
          </span>
        )}
        <div className="mt-3 overflow-x-auto rounded-2xl border border-[#dcebe3]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-[#f3faf6] text-[11px] uppercase tracking-wide text-[#8a90a0]">
                <th className="px-3 py-2 font-semibold">Exam</th>
                <th className="px-3 py-2 font-semibold">Session</th>
                <th className="px-3 py-2 text-right font-semibold">Pass rate</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dcebe3]">
              {displayedResults.map((result) => {
                const key = `${result.id_exam}-${result.session}`
                const isEditing = editingKey === key
                return (
                  <tr
                    key={`${result.id_exam}-${result.session}`}
                    className={isEditing ? 'bg-[#fafffd]' : undefined}
                  >
                    <td className="px-3 py-2 font-medium text-[#081220]">
                      {result.exam}
                    </td>
                    <td className="px-3 py-2 text-[#6e6e6e]">{result.session}</td>
                    <td className="px-3 py-2 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            autoFocus
                            value={draftPassRate}
                            onChange={(event) => setDraftPassRate(event.target.value)}
                            className="w-32 rounded-lg border border-[#d9a406] bg-white px-2 py-1.5 text-right font-semibold text-[#0a5e3d] shadow-sm outline-none transition-colors focus:border-[#f2c14e]"
                          />
                          <button
                            onClick={() => submitProposal()}
                            disabled={submitting}
                            title="Submit proposal"
                            className="flex h-7 w-9 items-center justify-center rounded-lg bg-[#0d7a4f] text-white transition-colors hover:bg-[#0a5e3d] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Check size={15} strokeWidth={2.4} />
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={submitting}
                            title="Cancel"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#dcebe3] bg-white text-[#5b6670] transition-colors hover:bg-[#f6faf8] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="font-semibold text-[#0a5e3d]">
                          {Number(result.pass_rate).toLocaleString()}%
                        </span>
                      )}
                      {editingKey === key && result.session === currentYear && (
                        <span className="ml-2 rounded-full bg-[#eef4f0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0d7a4f]">
                          Current
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing || hasPendingSubmission ? null : (
                        <button
                          onClick={() => startEditing(key)}
                          title="Edit this result"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5b6670] transition-colors hover:bg-[#e5f3ec] hover:text-[#0d7a4f]"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!submitting && editingKey === null && !hasPendingSubmission && (
          <p className="mt-2.5 text-[11px] text-[#8a90a0]">
            Click the pencil next to a result to change its pass rate — a
            super admin must approve the change before it goes live.
          </p>
        )}
        {hasPendingSubmission && editingKey === null && (
          <p className="mt-2.5 text-[11px] text-[#8a90a0]">
            Editing is disabled until the current proposal is decided by a super admin.
          </p>
        )}
        {editingKey !== null && !submitting && (
          <p className="mt-2.5 text-[11px] text-[#8a90a0]">
            Submitting creates a review proposal for this result only.
          </p>
        )}
      </section>

      <button
        onClick={() => setShowAllSessions((shown) => !shown)}
        className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0d7a4f] transition-colors hover:text-[#0a5e3d]"
      >
        {showAllSessions ? 'Show all sessions' : 'Show current session only'}
      </button>

      {/* Zone de notice / erreur */}
      {notice && (
        <div className="mt-3 rounded-xl border border-[#dcebe3] bg-[#f3faf6] px-4 py-2.5 text-[13px] font-medium text-[#0a5e3d]">
          {notice}
        </div>
      )}
      {submitError && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-700">
          {submitError}
        </div>
      )}
    </div>
  )
}