import { useState } from 'react'
import {
  X,
  GraduationCap,
  Phone,
  Mail,
  Globe,
  MapPin,
  UserRound,
  WalletCards,
  FileText,
  Check,
  ThumbsDown,
} from 'lucide-react'

import { AdminGlassCard, AdminStatusBadge } from './AdminShared'

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
]

function formatAmount(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return String(value)
  return `${number.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const FIELD_LABELS = {
  name: { label: 'Establishment name', icon: GraduationCap },
  phone: { label: 'Phone', icon: Phone },
  contact_email: { label: 'Email', icon: Mail },
  website: { label: 'Website', icon: Globe },
  address: { label: 'Address', icon: MapPin },
  director_name: { label: 'Director', icon: UserRound },
  director_title: { label: 'Director title', icon: UserRound },
  director_bio: { label: 'Director bio', icon: UserRound },
  description: { label: 'Description', icon: FileText },
  note: { label: 'Note', icon: FileText },
}

function formatValue(key, value) {
  if (value == null || value === '') return null
  if (Array.isArray(value)) return value.join(', ')
  return value
}

// Rendu du contenu proposé dans la modale : champs scalaires + tableau des
// frais. Les clés vides sont ignorées pour ne montrer que ce qui a changé.
function SubmissionContentSummary({ content, levelNames }) {
  const fees = content?.fees ?? []
  const fieldEntries = Object.entries(content ?? {}).filter(
    ([key, value]) => key !== 'fees' && formatValue(key, value) != null,
  )

  if (fieldEntries.length === 0 && fees.length === 0) {
    return <p className="py-6 text-center text-sm text-white/40">No change details recorded.</p>
  }

  return (
    <div className="space-y-5">
      {fieldEntries.map(([key, value]) => {
        const config = FIELD_LABELS[key] ?? { label: key.replace(/_/g, ' '), icon: FileText }
        const Icon = config.icon
        return (
          <div key={key}>
            <p className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
              <Icon size={12} /> {config.label}
            </p>
            <p className="text-[13px] font-medium text-white/80">{formatValue(key, value)}</p>
          </div>
        )
      })}

      {fees.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
            <WalletCards size={12} /> Fees
          </p>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-white/60">
                  <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Level</th>
                  <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider">
                    School year
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {fees.map((fee, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-[12px] font-medium text-white/80">
                      {levelNames.get(fee.id_level) ?? `Level ${fee.id_level}`}
                    </td>
                    <td className="px-3 py-2 text-[12px] text-white/50">{fee.school_year}</td>
                    <td className="px-3 py-2 text-right text-[12px] font-semibold text-[#34d399]">
                      {formatAmount(fee.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Modale de décision : contenu proposé + boutons Approuver / Rejeter. Le
// rejet affiche un champ de justification dont la saisie est obligatoire.
function SubmissionDetailModal({
  detail,
  levelNames,
  busy,
  serverError,
  onApprove,
  onReject,
  onClose,
}) {
  const [rejectionOpen, setRejectionOpen] = useState(false)
  const [reason, setReason] = useState('')

  const isPending = detail.submission_status === 'pending'

  function confirmReject() {
    if (reason.trim().length < 3) return
    onReject(reason.trim())
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-[20px] border border-white/10 bg-[#0d1a14] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-bold text-[#f5f5f4]">
              {detail.establishment_name}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] capitalize text-white/50">
                {detail.submission_type} by {detail.proposer_name}
              </span>
              <AdminStatusBadge status={detail.submission_status} />
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            disabled={Boolean(busy)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(88vh-190px)] overflow-y-auto px-5 py-5">
          {detail.rejection_reason && (
            <div className="mb-5 rounded-xl border border-[#ff6b6b]/30 bg-[rgba(255,107,107,0.12)] px-4 py-3 text-[12px] text-[#ff9d8f]">
              Rejected: {detail.rejection_reason}
            </div>
          )}

          <SubmissionContentSummary content={detail.content} levelNames={levelNames} />

          {serverError && (
            <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-300">
              {serverError}
            </div>
          )}

          {rejectionOpen && isPending && (
            <div className="mt-5 rounded-xl border border-[#ff6b6b]/30 bg-[rgba(255,107,107,0.08)] p-4">
              <label className="mb-2 block text-[12px] font-medium text-[#ff9d8f]">
                Reason for rejection (required)
              </label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                placeholder="Explain why this proposal is rejected…"
                className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-[#f5f5f4] placeholder:text-white/30 focus:border-[#ff6b6b] focus:outline-none"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => setRejectionOpen(false)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-white/70 transition-colors hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  disabled={reason.trim().length < 3 || Boolean(busy)}
                  className="rounded-lg bg-[linear-gradient(135deg,#dc2626,#ff6b6b)] px-3 py-1.5 text-[12px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Confirm rejection
                </button>
              </div>
            </div>
          )}
        </div>

        {isPending && (
          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-5 py-4">
            <button
              onClick={() => setRejectionOpen(true)}
              disabled={Boolean(busy)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] font-medium text-[#ff9d8f] transition-colors hover:border-[#ff6b6b]/50"
            >
              <ThumbsDown size={16} /> Reject
            </button>
            <button
              onClick={onApprove}
              disabled={Boolean(busy)}
              className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#059669,#34d399)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(5,150,105,0.3)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check size={16} /> {busy === 'approve' ? 'Approving…' : 'Approve'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Liste des soumissions avec filtre par état (Pending/Approved/Rejected/All).
export default function AdminSubmissionsView({
  submissions,
  filter,
  onFilterChange,
  onOpenDetail,
}) {
  const filtered =
    filter === 'all' ? submissions : submissions.filter((item) => item.submission_status === filter)

  return (
    <AdminGlassCard className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-[18px] font-semibold text-[#f5f5f4]">Submissions</h3>
          <p className="mt-1 text-[13px] text-white/40">Review school proposals.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id)}
              className={`rounded-xl px-4 py-2 text-[13px] transition-colors ${
                filter === f.id
                  ? 'bg-white/8 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau des soumissions, défilable horizontalement en mobile. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.5px] text-white/40">
                Establishment
              </th>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.5px] text-white/40">
                Proposer
              </th>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.5px] text-white/40">
                Type
              </th>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.5px] text-white/40">
                Status
              </th>
              <th className="px-4 py-4 text-left text-[12px] font-semibold uppercase tracking-[0.5px] text-white/40">
                Submitted
              </th>
              <th className="px-4 py-4 text-right text-[12px] font-semibold uppercase tracking-[0.5px] text-white/40">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((item) => (
              <tr
                key={item.submission_uuid}
                className="transition-colors hover:bg-white/8"
              >
                <td className="px-4 py-4 text-[14px] font-medium text-[#f5f5f4]">
                  {item.establishment_name}
                </td>
                <td className="px-4 py-4 text-[14px] text-white/70">{item.proposer_name}</td>
                <td className="px-4 py-4 text-[14px] capitalize text-white/70">
                  {item.submission_type}
                </td>
                <td className="px-4 py-4">
                  <AdminStatusBadge status={item.submission_status} />
                </td>
                <td className="px-4 py-4 text-[14px] text-white/70">
                  {formatDate(item.submitted_at)}
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={() => onOpenDetail(item.submission_uuid)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-white/80 transition-colors hover:border-[#34d399] hover:text-white"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-white/40">No submissions in this state.</p>
        )}
      </div>
    </AdminGlassCard>
  )
}

export { SubmissionDetailModal }
