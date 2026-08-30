import { useState } from 'react'
import { Clock, CheckCircle2, XCircle, FileText, ChevronRight } from 'lucide-react'

import StatusBadge from './StatusBadge'
import SubmissionDetailModal from './SubmissionDetailModal'

// Pictogramme + pastille colorés par statut, pour balayer rapidement l'état
// de chaque soumission (pendante ambre, approuvée verte, refusée rouge).
const STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
}

// Liseré gauche et pastille partagés entre la carte mobile et la ligne du
// tableau : même langage visuel, quel que soit le support.
function statusTone(status) {
  if (status === 'rejected') {
    return { edge: 'border-l-[#d6453d]', box: 'bg-red-50 text-red-600' }
  }
  if (status === 'approved') {
    return { edge: 'border-l-[#0d7a4f]', box: 'bg-[#e5f3ec] text-[#0a5e3d]' }
  }
  return { edge: 'border-l-[#d9a406]', box: 'bg-[#fdf3dd] text-[#8a5b00]' }
}

function FormattedDate({ datetime }) {
  return new Date(datetime).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Carte empilée pour les écrans étroits : nom, type, statut, date et note.
// Le liseré de gauche reprend la couleur du statut pour une lecture rapide.
function SubmissionCard({ submission, onSelect }) {
  const StatusIcon = STATUS_ICONS[submission.submission_status] ?? Clock
  const tone = statusTone(submission.submission_status)

  return (
    <article
      onClick={() => onSelect(submission)}
      className={`flex cursor-pointer flex-col gap-3 border-l-[3px] bg-white p-4 transition-colors hover:bg-[#f7fbf9] ${tone.edge}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.box}`}>
            <StatusIcon size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#081220]">
              {submission.establishment_name}
            </p>
            <p className="truncate text-[11px] capitalize text-[#8a90a0]">
              {submission.submission_type}
            </p>
          </div>
        </div>
        <StatusBadge status={submission.submission_status} />
      </div>
      {submission.rejection_reason && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {submission.rejection_reason}
        </p>
      )}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[#8a90a0]">
          Submitted <FormattedDate datetime={submission.submitted_at} />
        </p>
        <span className="flex items-center gap-0.5 text-[11px] font-semibold text-[#0d7a4f]">
          View changes <ChevronRight size={13} />
        </span>
      </div>
    </article>
  )
}

// Ligne du tableau (écrans moyens et plus) : établissement, statut, note, date
// et chevron. Toute la ligne est cliquable pour ouvrir le détail de la soumission.
function SubmissionRow({ submission, rowClassName = '', onSelect }) {
  const StatusIcon = STATUS_ICONS[submission.submission_status] ?? Clock
  const tone = statusTone(submission.submission_status)

  return (
    <tr
      onClick={() => onSelect(submission)}
      className={`cursor-pointer border-t border-[#eef2ef] transition-colors hover:bg-[#eef7f1] ${rowClassName}`}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.box}`}>
            <StatusIcon size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#081220]">
              {submission.establishment_name}
            </p>
            <p className="truncate text-[11px] capitalize text-[#8a90a0]">
              {submission.submission_type}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <StatusBadge status={submission.submission_status} />
      </td>
      <td className="max-w-[260px] px-5 py-3.5 text-[12px] text-[#5b6670]">
        {submission.rejection_reason ? (
          <span className="text-red-600">{submission.rejection_reason}</span>
        ) : (
          <span className="text-[#b0b7c0]">—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-5 py-3.5 text-right text-[12px] text-[#5b6670]">
        <FormattedDate datetime={submission.submitted_at} />
      </td>
      <td className="px-3 py-3.5 text-right">
        <span className="flex items-center justify-end gap-1 text-[11px] font-semibold text-[#0d7a4f]">
          View <ChevronRight size={14} />
        </span>
      </td>
    </tr>
  )
}

// Historique des propositions d'un responsable : cartes empilées sur mobile,
// tableau sur écran moyen et plus — plus récentes d'abord (tri du backend).
export default function SubmissionsList({ submissions, meta }) {
  const [selectedSubmission, setSelectedSubmission] = useState(null)

  // Correspondances id -> nom issues des références (/filters-meta) : servent
  // à afficher les noms de niveaux et de programmes dans le détail, pas les IDs.
  const levelNames = new Map((meta?.levels ?? []).map((level) => [level.id, level.name]))
  const programNames = new Map((meta?.programs ?? []).map((program) => [program.id, program.name]))

  if (submissions.length === 0) {
    return (
      <div className="rounded-[18px] border border-[#e7ece9] bg-white px-6 py-12 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4f0] text-[#0d7a4f]">
          <FileText size={22} />
        </span>
        <p className="mt-4 text-sm font-semibold text-[#081220]">No submission yet</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-[#5b6670]">
          Propose a school or a modification to track its review status here.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#e7ece9] bg-white shadow-[0_10px_30px_rgba(10,94,61,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-[16px] font-bold text-[#081220]">
            Submission history
          </h2>
          <p className="mt-0.5 text-[12px] text-[#8a90a0]">
            Track your school proposals from submission to decision.
          </p>
        </div>
        <span className="inline-flex items-center rounded-lg border border-[#e7ece9] bg-[#f7fbf9] px-3 py-1.5 text-[11px] font-semibold text-[#0d7a4f]">
          {submissions.length} total
        </span>
      </div>

      {/* Cartes empilées — mobile (< md) */}
      <div className="grid gap-2.5 p-3 md:hidden">
        {submissions.map((submission) => (
          <SubmissionCard
            key={submission.submission_uuid}
            submission={submission}
            onSelect={setSelectedSubmission}
          />
        ))}
      </div>

      {/* Tableau — écran moyen et plus */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-[#0d7a4f] bg-[#0a3d2c] text-white">
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Establishment</th>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Note</th>
              <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider">Submitted</th>
              <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider">View</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission, index) => (
              <SubmissionRow
                key={submission.submission_uuid}
                submission={submission}
                rowClassName={index % 2 === 1 ? 'bg-[#f7fbf9]' : 'bg-white'}
                onSelect={setSelectedSubmission}
              />
            ))}
          </tbody>
        </table>
      </div>

      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          levelNames={levelNames}
          programNames={programNames}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  )
}
