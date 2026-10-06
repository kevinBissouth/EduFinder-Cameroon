import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  Building2,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Sparkles,
  UserRoundCheck,
  UserRoundX,
  PlayCircle,
} from 'lucide-react'

import { AdminGlassCard } from './AdminShared'
import { useCountUp } from '../../hooks/useCountUp'

// Compteur animé (montée de 0 à la valeur) déclenché dès que la carte entre
// dans le viewport, comme .stat-value du template.
function StatValue({ value, started, suffix = '' }) {
  const animated = useCountUp(value, started, 2000)
  return (
    <span className="font-mono text-[32px] font-bold text-transparent bg-[linear-gradient(135deg,#f5f5f4,#ffffffb3)] bg-clip-text">
      {animated.toLocaleString('en-US')}
      {suffix}
    </span>
  )
}

// Pastille icône colorée en dégradé translucide (variantes cyan/magenta/
// purple/success du template), avec la couleur rayonnante du stroke.
const ICON_STYLES = {
  emerald: {
    box: 'shadow-[0_8px_32px_rgba(52,211,153,0.2)] bg-[linear-gradient(135deg,rgba(52,211,153,0.2),rgba(52,211,153,0.05))]',
    stroke: 'text-[#34d399]',
  },
  gold: {
    box: 'shadow-[0_8px_32px_rgba(212,165,116,0.2)] bg-[linear-gradient(135deg,rgba(212,165,116,0.2),rgba(212,165,116,0.05))]',
    stroke: 'text-[#d4a574]',
  },
  coral: {
    box: 'shadow-[0_8px_32px_rgba(224,122,95,0.2)] bg-[linear-gradient(135deg,rgba(224,122,95,0.2),rgba(224,122,95,0.05))]',
    stroke: 'text-[#e07a5f]',
  },
  success: {
    box: 'shadow-[0_8px_32px_rgba(34,197,94,0.2)] bg-[linear-gradient(135deg,rgba(34,197,94,0.2),rgba(34,197,94,0.05))]',
    stroke: 'text-[#22c55e]',
  },
}

function StatCard({ title, value, started, icon: Icon, tone }) {
  const style = ICON_STYLES[tone]
  return (
    <AdminGlassCard className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="mb-2 text-[13px] font-medium uppercase tracking-[0.5px] text-white/70">
            {title}
          </h4>
          <StatValue value={value} started={started} />
          <div className="mt-3 inline-flex items-center gap-1 rounded-[20px] bg-[rgba(34,197,94,0.15)] px-2.5 py-1 text-[13px] font-medium text-[#22c55e]">
            <ArrowUpRight size={14} /> live
          </div>
        </div>
        <span className={`flex h-[55px] w-[55px] items-center justify-center rounded-2xl ${style.box}`}>
          <Icon size={26} strokeWidth={1.8} className={style.stroke} />
        </span>
      </div>
    </AdminGlassCard>
  )
}

// Couleurs et icônes d'une action selon l'état de la soumission réelle.
const ACTION_TONE = {
  pending: { icon: ClipboardList, tone: 'gold' },
  approved: { icon: CheckCircle2, tone: 'success' },
  rejected: { icon: XCircle, tone: 'coral' },
}
const ACTION_VERB = {
  creation: 'created',
  modification: 'updated',
}

function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ActionPillIcon({ status }) {
  const config = ACTION_TONE[status] ?? ACTION_TONE.pending
  const Icon = config.icon
  const style = ICON_STYLES[config.tone]
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.box}`}>
      <Icon size={18} className={style.stroke} />
    </span>
  )
}

// Carrousel « Recent actions » : toutes les vraies soumissions, triées par date,
// n'en montre qu'une à la fois. L'action reste ~1,5 s puis glisse vers le haut
// et s'efface ; la suivante monte avec un fondu. Le timer recommence à chaque
// action pour garder un rythme régulier de ~2 s.
function RecentActions({ submissions }) {
  const actions = useMemo(
    () =>
      submissions
        .slice()
        .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
        .map((item) => ({
          key: item.submission_uuid,
          status: item.submission_status,
          proposer: item.proposer_name,
          verb: ACTION_VERB[item.submission_type] ?? item.submission_type,
          school: item.establishment_name,
          when: formatDateTime(item.submitted_at),
        })),
    [submissions],
  )

  const [actionIndex, setActionIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const hasMultiple = actions.length > 1

  useEffect(() => {
    if (!hasMultiple) return undefined
    const leaveTimer = setInterval(() => setLeaving(true), 1500)
    return () => clearInterval(leaveTimer)
  }, [hasMultiple, actionIndex])

  useEffect(() => {
    if (!leaving || !hasMultiple) return undefined
    const swapTimer = setTimeout(() => {
      setActionIndex((index) => (index + 1) % actions.length)
      setLeaving(false)
    }, 500)
    return () => clearTimeout(swapTimer)
  }, [leaving, hasMultiple, actions.length])

  if (actions.length === 0) {
    return (
      <p className="flex items-center gap-2 py-8 text-center text-[13px] text-white/40">
        <ClipboardList size={16} /> No actions yet.
      </p>
    )
  }

  const current = actions[actionIndex] ?? actions[0]

  return (
    <div className="overflow-hidden">
      <div
        key={`${current.key}-${actionIndex}`}
        className={leaving ? 'animate-action-out' : 'animate-action-in'}
      >
        <div className="flex items-start gap-4">
          <ActionPillIcon status={current.status} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] leading-relaxed text-white/70">
              <strong className="font-medium text-[#f5f5f4]">{current.proposer}</strong>{' '}
              {current.verb}{' '}
              <strong className="font-medium text-[#f5f5f4]">{current.school}</strong>
            </p>
            <p className="mt-1 text-[12px] text-white/40">{current.when}</p>
          </div>
        </div>
      </div>
      {hasMultiple && (
        <div className="mt-4 flex items-center gap-1.5">
          {actions.map((action, index) => (
            <span
              key={action.key}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === actionIndex ? 'w-5 bg-[#34d399]' : 'w-2.5 bg-white/15'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Santé du parc d'établissements, calculée sur les vraies données : répartition
// par statut + alerte sur les fiches sans aucun responsable rattaché.
function EstablishmentsHealth({ establishments }) {
  const counts = useMemo(() => {
    const byStatus = {}
    let noManager = 0
    establishments.forEach((item) => {
      byStatus[item.establishment_status] = (byStatus[item.establishment_status] ?? 0) + 1
      if (item.owners.length === 0) noManager += 1
    })
    return {
      byStatus,
      noManager,
      total: establishments.length,
      published: byStatus.published ?? 0,
      pending: byStatus.pending ?? 0,
      suspended: byStatus.suspended ?? 0,
    }
  }, [establishments])

  const publishedShare = counts.total > 0 ? Math.round((counts.published / counts.total) * 100) : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-white/70">Published</span>
        <span className="font-mono text-[16px] font-bold text-[#f5f5f4]">{publishedShare}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#059669,#34d399)]"
          style={{ width: `${publishedShare}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <HealthMetric label="Published" value={counts.published} tone="text-[#22c55e]" />
        <HealthMetric label="Pending" value={counts.pending} tone="text-[#eab308]" />
        <HealthMetric label="Suspended" value={counts.suspended} tone="text-[#94a3b8]" />
      </div>

      {counts.noManager > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-[#d4a574]/25 bg-[rgba(212,165,116,0.1)] px-4 py-3">
          <UserRoundX size={16} className="mt-0.5 shrink-0 text-[#d4a574]" />
          <p className="text-[12px] leading-relaxed text-[#e9cfae]">
            <strong className="font-medium">{counts.noManager}</strong>{' '}
            {counts.noManager === 1 ? 'establishment has' : 'establishments have'} no manager
            attached yet.
          </p>
        </div>
      )}
    </div>
  )
}

function HealthMetric({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
      <p className={`font-mono text-[18px] font-bold ${tone}`}>{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
    </div>
  )
}

// Vue d'accueil de l'espace super admin : quatre cartes statistiques puis trois
// panneaux — actions récentes en carrousel, santé des établissements et revue
// en attente.
export default function AdminDashboard({ stats, submissions, establishments, onNavigate }) {
  const [started, setStarted] = useState(false)

  // Je lance les compteurs animés dès le premier affichage du dashboard : le
  // rendu est déclenché après le chargement des données, donc les valeurs
  // finales sont déjà connues.
  useEffect(() => {
    setStarted(true)
  }, [])

  const pendingCount = stats.pending

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending reviews"
          value={stats.pending}
          started={started}
          icon={ClipboardList}
          tone="gold"
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          started={started}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          started={started}
          icon={XCircle}
          tone="coral"
        />
        <StatCard
          title="Establishments"
          value={stats.establishments}
          started={started}
          icon={Building2}
          tone="emerald"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <AdminGlassCard className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-[16px] font-semibold text-[#f5f5f4]">
                <Sparkles size={16} className="text-[#d4a574]" /> Recent actions
              </h3>
              <p className="mt-1 text-[12px] text-white/40">Latest submissions, one at a time</p>
            </div>
            <button
              onClick={() => onNavigate('submissions')}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-white/80 transition-colors hover:border-[#34d399] hover:text-white"
            >
              View all
            </button>
          </div>
          <RecentActions submissions={submissions} />
        </AdminGlassCard>

        <AdminGlassCard className="p-6">
          <div className="mb-5">
            <h3 className="flex items-center gap-2 text-[16px] font-semibold text-[#f5f5f4]">
              <Building2 size={16} className="text-[#34d399]" /> Establishments health
            </h3>
            <p className="mt-1 text-[12px] text-white/40">Real breakdown of the whole catalogue</p>
          </div>
          <EstablishmentsHealth establishments={establishments} />
        </AdminGlassCard>

        <AdminGlassCard className="p-6">
          <div className="mb-5">
            <h3 className="flex items-center gap-2 text-[16px] font-semibold text-[#f5f5f4]">
              <PlayCircle size={16} className="text-[#e07a5f]" /> Review pipeline
            </h3>
            <p className="mt-1 text-[12px] text-white/40">
              Approve or reject schools awaiting your decision.
            </p>
          </div>
          {pendingCount > 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-[#eab308]/20 bg-[rgba(234,179,8,0.08)] px-4 py-3">
              <UserRoundCheck size={18} className="shrink-0 text-[#eab308]" />
              <p className="text-[13px] text-white/70">
                <strong className="font-medium text-[#f5f5f4]">{pendingCount}</strong>{' '}
                {pendingCount === 1 ? 'submission' : 'submissions'} pending your review.
              </p>
            </div>
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] text-white/40">
              All caught up — nothing pending.
            </p>
          )}
          <button
            onClick={() => onNavigate('submissions')}
            disabled={pendingCount === 0}
            className="mt-4 w-full rounded-xl bg-[linear-gradient(135deg,#059669,#34d399)] px-4 py-3.5 text-[15px] font-medium text-white shadow-[0_8px_24px_rgba(5,150,105,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(5,150,105,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Review pending submissions
          </button>
        </AdminGlassCard>
      </div>
    </>
  )
}
