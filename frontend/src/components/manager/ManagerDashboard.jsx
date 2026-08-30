import {
  Building2,
  ClipboardList,
  CheckCircle2,
  Zap,
  Plus,
  Send,
  Upload,
  Wrench,
  ChevronRight,
  Eye,
  Pencil,
  ArrowUpRight,
  XCircle,
} from 'lucide-react'

import StatusBadge from './StatusBadge'
import { SHADOW_CARD } from './dashTokens'
import ManagerKpiCards from './ManagerKpiCards'

// ─── Actions rapides ─────────────────────────────────────────────────────────
// Quatre raccourcis empilés, fond vert pâle avec halo décoratif en haut à
// droite : icône verte, libellé, chevron à droite.
function QuickActionRow({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex h-[48px] w-full items-center gap-3 rounded-[10px] border border-[rgba(13,122,79,0.45)] bg-white px-3.5 text-left transition-[transform,filter] duration-150 hover:-translate-y-0.5 hover:brightness-105"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e5f3ec] text-[#0d7a4f]">
        <Icon size={17} strokeWidth={1.8} />
      </span>
      <span className="flex-1 text-[13px] font-semibold text-[#081220]">{label}</span>
      <ChevronRight size={16} className="text-[#0d7a4f]" strokeWidth={2} />
    </button>
  )
}

// ─── Établissements : table ──────────────────────────────────────────────────
function EstablishmentsTable({ establishments, onViewDetail }) {
  return (
    <table className="w-full min-w-[560px] text-left">
      <thead>
        <tr className="bg-[#0a3d2c] text-white">
          {['Name', 'City', 'Sector', 'Level', 'Status', 'Published year', ''].map((label, index) => (
            <th
              key={label}
              className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider ${
                index === 0 ? 'rounded-tl-[18px]' : ''
              } ${index === 6 ? 'rounded-tr-[18px] text-right' : ''}`}
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {establishments.map((school, index) => (
          <tr
            key={school.establishment_uuid}
            className={`transition-colors hover:bg-[#f0f8f4] ${
              index % 2 === 1 ? 'bg-[#f7fbf9]' : 'bg-white'
            }`}
          >
            <td className="px-4 py-2.5 text-[13px] font-semibold text-[#081220]">
              {school.name}
            </td>
            <td className="px-4 py-2.5 text-[12px] text-[#343a44]">{school.city ?? '—'}</td>
            <td className="px-4 py-2.5 text-[12px] text-[#343a44]">{school.sector ?? '—'}</td>
            <td className="px-4 py-2.5 text-[12px] text-[#343a44]">{school.type ?? '—'}</td>
            <td className="px-4 py-2.5">
              <StatusBadge status={school.establishment_status} />
            </td>
            <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-[#343a44]">
              {school.establishment_status === 'published'
                ? school.published_year ?? '—'
                : '—'}
            </td>
            <td className="px-4 py-2.5">
              <div className="flex items-center justify-end gap-0.5">
                <IconButton
                  title="View"
                  onClick={() => onViewDetail(school.establishment_uuid)}
                >
                  <Eye size={14} strokeWidth={1.8} />
                </IconButton>
                <IconButton title="Edit">
                  <Pencil size={14} strokeWidth={1.8} />
                </IconButton>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function IconButton({ title, onClick, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5b6670] transition-colors hover:bg-[#e5f3ec] hover:text-[#0d7a4f]"
    >
      {children}
    </button>
  )
}

// ─── Soumissions récentes : timeline ─────────────────────────────────────────
function SubmissionTimeline({ submissions }) {
  if (submissions.length === 0) {
    return (
      <p className="rounded-xl bg-[#f7fbf9] px-4 py-5 text-[13px] text-[#5b6670]">
        Aucune soumission pour le moment.
      </p>
    )
  }
  return (
    <ol className="relative pl-5">
      <span className="absolute left-[4px] top-2 bottom-2 w-[2px] bg-[rgba(13,122,79,0.5)]" />
      {submissions.map((submission, index) => {
        const isLatest = index === 0
        return (
          <li
            key={submission.submission_uuid}
            className={`relative flex items-center gap-3 rounded-lg px-2.5 py-2 ${
              isLatest ? 'border-l-[3px] border-[#0d7a4f] bg-[#f0f8f4]' : ''
            }`}
          >
            <span className="absolute -left-5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-[#0d7a4f] bg-white" />
            <span className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[#081220]">
                {submission.establishment_name}
                <span className="ml-2 text-[11px] font-normal text-[#8a90a0]">
                  {submission.submission_type}
                </span>
              </p>
              <time className="text-[11px] text-[#8a90a0]">
                {new Date(submission.submitted_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </time>
            </span>
            <span className="shrink-0 text-[11px] font-semibold text-[#0d7a4f]">View</span>
          </li>
        )
      })}
    </ol>
  )
}

// ─── Aperçu des activités : 4 métriques compactes ────────────────────────────
// Chaque carte affiche un total réel et sa part (en %) du total des soumissions,
// y compris une barre dont la largeur reflète cette même part. Rien n'est
// obtenu en dur : toutes les valeurs sont dérivées des soumissions reçues.
function ActivityMetric({ icon: Icon, label, value, sharePercent }) {
  const bar = value > 0 ? 'bg-[#0d7a4f]' : 'bg-[#d9a406]'
  return (
    <div className="rounded-xl border border-[#e7ece9] bg-white px-3 py-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e5f3ec] text-[#0d7a4f]">
          <Icon size={15} strokeWidth={1.8} />
        </span>
        <p className="text-[20px] font-bold leading-none text-[#081220]">{value}</p>
      </div>
      <p className="mt-2 text-[10px] leading-tight text-[#5b6670]">{label}</p>
      <div className="mt-2 flex items-center gap-1">
        <span className="text-[11px] font-semibold text-[#0a5e3d]">{sharePercent}%</span>
        <div className="ml-auto h-1 w-10 overflow-hidden rounded-full bg-[#eef2f0]">
          <div className={`h-full rounded-full ${bar}`} style={{ width: `${sharePercent}%` }} />
        </div>
      </div>
    </div>
  )
}

export default function ManagerDashboard({
  establishments,
  onViewDetail,
  onViewSubmissions,
  onCreateProposal,
  onNavigate,
  submissions = [],
  examSessionCount = 0,
}) {
  // Aucune fiche : invitation à proposer le premier établissement.
  if (establishments.length === 0) {
    return (
      <div className="rounded-[20px] border border-[#e7ece9] bg-white p-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4f0] text-[#0d7a4f]">
          <Building2 size={26} />
        </span>
        <p className="mt-4 font-display text-xl font-bold text-[#081220]">No establishment yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-[#5b6670]">
          Propose your first establishment — an administrator will validate it before publishing.
        </p>
        <button
          onClick={onCreateProposal}
          className="mt-5 inline-flex items-center gap-2 rounded-[12px] bg-[linear-gradient(135deg,#0d7a4f_0%,#12a066_50%,#0a5e3d_100%)] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(13,122,79,0.28)]"
        >
          <Plus size={16} /> Propose an establishment
        </button>
      </div>
    )
  }

  // Données réelles pour l'aperçu des activités (part du total).
  const pendingSubmissions = submissions.filter(
    (submission) => submission.submission_status === 'pending',
  ).length
  const submittedCount = submissions.length
  const approvedCount = submissions.filter(
    (submission) => submission.submission_status === 'approved',
  ).length
  const rejectedCount = submissions.filter(
    (submission) => submission.submission_status === 'rejected',
  ).length

  return (
    <div>
      {/* Quatre tuiles KPI */}
      <ManagerKpiCards
        establishments={establishments}
        submissions={submissions}
        examSessionCount={examSessionCount}
        onNavigate={onNavigate}
      />

      {/* Grille principale : table (dominante) + actions rapides */}
      <section className="mt-[18px] grid grid-cols-1 items-start gap-[18px] xl:grid-cols-[minmax(0,2.05fr)_minmax(300px,1fr)]">
        {/* Mes établissements */}
        <div className={`overflow-hidden rounded-[18px] border border-[#e7ece9] bg-white ${SHADOW_CARD}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <h2 className="flex items-center gap-2 text-[16px] font-bold text-[#081220]">
              <Building2 size={17} className="text-[#0d7a4f]" /> My establishments
            </h2>
            <div className="flex gap-2">
              <span className="inline-flex items-center rounded-lg border border-[#e7ece9] bg-white px-3 py-1.5 text-[11px] font-medium text-[#343a44]">
                All statuses
              </span>
              <button
                onClick={onCreateProposal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#d9a406,#c29105)] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-[0_6px_18px_rgba(217,164,6,0.18)]"
              >
                <Plus size={13} /> New submission
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <EstablishmentsTable
              establishments={establishments}
              onViewDetail={onViewDetail}
            />
          </div>
          <div className="border-t border-[#e7ece9] p-2.5 text-center">
            <button
              onClick={() => onNavigate('schools')}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0d7a4f] transition-colors hover:text-[#0a5e3d]"
            >
              View all establishments <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="relative overflow-hidden rounded-[18px] border border-[#e7ece9] bg-[radial-gradient(circle_at_100%_0%,rgba(167,227,198,0.45),transparent_30%),#f0f8f4] p-4">
          <h2 className="flex items-center gap-2 text-[16px] font-bold text-[#081220]">
            <Zap size={17} className="text-[#d9a406]" /> Quick actions
          </h2>
          <div className="mt-3 space-y-2.5">
            <QuickActionRow
              icon={Plus}
              label="Add an establishment"
              onClick={onCreateProposal}
            />
            <QuickActionRow
              icon={Send}
              label="Submit fees"
              onClick={() => onNavigate('fees')}
            />
            <QuickActionRow
              icon={Upload}
              label="Import results"
              onClick={() => onNavigate('exam')}
            />
            <QuickActionRow
              icon={Wrench}
              label="Manage services"
              onClick={() => onNavigate('services')}
            />
          </div>
        </div>
      </section>

      {/* Seconde rangée : soumissions récentes + aperçu des activités */}
      <section className="mt-[18px] grid grid-cols-1 items-start gap-[18px] xl:grid-cols-[minmax(0,2.05fr)_minmax(360px,1fr)]">
        <div
          className={`rounded-[18px] border border-[#e7ece9] bg-white p-4 ${SHADOW_CARD}`}
        >
          <h2 className="text-[16px] font-bold text-[#081220]">Recent submissions</h2>
          <p className="mt-1 max-w-md text-[12px] text-[#5b6670]">
            Track the review status of your establishment and update submissions.
          </p>
          <div className="mt-3">
            <SubmissionTimeline submissions={submissions} />
          </div>
          <div className="mt-3 border-t border-[#e7ece9] pt-2.5 text-center">
            <button
              onClick={onViewSubmissions}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0d7a4f] transition-colors hover:text-[#0a5e3d]"
            >
              View all submissions <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        <div className={`rounded-[18px] border border-[#e7ece9] bg-white p-4 ${SHADOW_CARD}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-[16px] font-bold text-[#081220]">Activity overview</h2>
              <p className="mt-1 text-[11px] text-[#8a90a0]">
                Share of your total submissions
              </p>
            </div>
            <button
              onClick={onViewSubmissions}
              className="text-[11px] font-semibold text-[#0d7a4f] hover:text-[#0a5e3d]"
            >
              View all in submissions →
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <ActivityMetric
              icon={Send}
              label="Submissions sent"
              value={submittedCount}
              sharePercent={submittedCount > 0 ? 100 : 0}
            />
            <ActivityMetric
              icon={ClipboardList}
              label="Under review"
              value={pendingSubmissions}
              sharePercent={submittedCount > 0 ? Math.round((pendingSubmissions / submittedCount) * 100) : 0}
            />
            <ActivityMetric
              icon={CheckCircle2}
              label="Published"
              value={approvedCount}
              sharePercent={submittedCount > 0 ? Math.round((approvedCount / submittedCount) * 100) : 0}
            />
            <ActivityMetric
              icon={XCircle}
              label="Rejected"
              value={rejectedCount}
              sharePercent={submittedCount > 0 ? Math.round((rejectedCount / submittedCount) * 100) : 0}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
