import { Building2, ClipboardList, CheckCircle2, ChartNoAxesColumn, ArrowUpRight } from 'lucide-react'

import { SHADOW_CARD } from './dashTokens'

// Quatre tuiles KPI du responsable, identiques dans le dashboard et dans
// chaque section : mêmes titres, mêmes statistiques réelles (dérivées des
// établissements et des soumissions), et un lien de navigation par carte.
function StatCard({ icon: Icon, iconBg, accent, title, value, subtitle, linkLabel, onNavigate }) {
  return (
    <div
      className={`relative min-h-[104px] overflow-hidden rounded-[18px] border border-[#e7ece9] bg-white px-4 py-3 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(10,94,61,0.10),0_4px_12px_rgba(8,18,32,0.04)] ${SHADOW_CARD}`}
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <p className="text-[13px] font-semibold leading-tight text-[#343a44]">{title}</p>
      </div>
      <p className="mt-2 text-[26px] font-bold leading-none text-[#081220]">{value}</p>
      <p className="mt-1 text-[11px] text-[#5b6670]">{subtitle}</p>
      <button
        onClick={onNavigate}
        className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#0d7a4f] transition-colors hover:text-[#0a5e3d]"
      >
        {linkLabel} <ArrowUpRight size={12} />
      </button>
    </div>
  )
}

// Les stats viennent des données réelles du responsable : nombre
// d'établissements gérés (tous statuts confondus), soumissions en attente,
// établissements publiés et sessions d'examens de la fiche sélectionnée.
export default function ManagerKpiCards({ establishments, submissions = [], examSessionCount = 0, onNavigate }) {
  const managedCount = establishments.length
  const pendingSubmissions = submissions.filter(
    (submission) => submission.submission_status === 'pending',
  ).length
  const publishedCount = establishments.filter(
    (school) => school.establishment_status === 'published',
  ).length

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={Building2}
        iconBg="bg-[#e5f3ec] text-[#0d7a4f]"
        accent="#0d7a4f"
        title="Managed establishments"
        value={managedCount}
        subtitle="All your establishments"
        linkLabel="View all"
        onNavigate={() => onNavigate('schools')}
      />
      <StatCard
        icon={ClipboardList}
        iconBg="bg-[#fbf0d3] text-[#b5860b]"
        accent="#d9a406"
        title="Pending submissions"
        value={pendingSubmissions}
        subtitle="Awaiting validation"
        linkLabel="View pending"
        onNavigate={() => onNavigate('submissions')}
      />
      <StatCard
        icon={CheckCircle2}
        iconBg="bg-[#e5f3ec] text-[#0d7a4f]"
        accent="#0d7a4f"
        title="Published"
        value={publishedCount}
        subtitle="Published establishments"
        linkLabel="View published"
        onNavigate={() => onNavigate('schools')}
      />
      <StatCard
        icon={ChartNoAxesColumn}
        iconBg="bg-[#fbf0d3] text-[#b5860b]"
        accent="#d9a406"
        title="Exam results"
        value={examSessionCount}
        subtitle="Sessions available"
        linkLabel="View results"
        onNavigate={() => onNavigate('exam')}
      />
    </section>
  )
}