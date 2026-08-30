import { Building2 } from "lucide-react"

import ManagerFeesSection from './ManagerFeesSection'
import { SHADOW_CARD } from './dashTokens'

// Année en cours = la plus récente présente dans les frais (les années
// précédentes restent visibles en lecture seule). Le format "YYYY-YYYY"
// étant fixe, un tri lexicographique donne l'ordre chronologique sans NaN.
const pickCurrentYear = (fees) =>
  fees.length ? [...fees.map((fee) => fee.school_year)].sort().at(-1) : null

// Barres horizontales des frais par niveau de l'année en cours : dégradé
// vert → vert clair, la barre la plus élevée légèrement accentuée.
function FeesByLevelBars({ fees }) {
  if (fees.length === 0) {
    return (
      <p className="rounded-xl bg-[#f7fbf9] px-4 py-5 text-[13px] text-[#5b6670]">
        No fees for this session yet.
      </p>
    )
  }
  const maxAmount = Math.max(...fees.map((fee) => Number(fee.amount)))
  return (
    <div className="space-y-3.5">
      {fees.map((fee) => {
        const amount = Number(fee.amount)
        const ratio = maxAmount ? (amount / maxAmount) * 100 : 0
        const isHighest = fees.length > 1 && amount === maxAmount
        return (
          <div key={`${fee.id_level}-${fee.school_year}`}>
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-[#081220]">{fee.class}</span>
              <span className={isHighest ? 'font-bold text-[#0a5e3d]' : 'text-[#5b6670]'}>
                {amount.toLocaleString()} FCFA
              </span>
            </div>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-[#eef2f0]">
              <div
                className={`h-full rounded-full ${
                  isHighest ? 'bg-[linear-gradient(90deg,#0a5e3d,#2ec27e)]' : 'bg-[linear-gradient(90deg,#0d7a4f,#2ec27e)]'
                }`}
                style={{ width: `${ratio}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Vue « Fees & Payments » du responsable : autonome, sans redirection. Le
// sélecteur d'établissement (chips) filtre le contenu sur place quand le
// responsable gère plusieurs écoles.
export default function ManagerFeesView({
  establishments,
  selectedUuid,
  onSelectSchool,
  detail,
  detailStatus,
  reloadDetail,
  paymentMethods = [],
}) {
  if (establishments.length === 0) {
    return (
      <div className="rounded-[20px] border border-[#e7ece9] bg-white p-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4f0] text-[#0d7a4f]">
          <Building2 size={26} />
        </span>
        <p className="mt-4 font-display text-xl font-bold text-[#081220]">No school yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-[#5b6670]">
          Propose your first establishment — once approved, you can manage its fees here.
        </p>
      </div>
    )
  }

  if (detailStatus === 'loading' && !detail) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-[#8a90a0]">
        Loading fees…
      </div>
    )
  }
  if (detailStatus === 'error' || !detail) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        Unable to load your fees. Make sure the server is running, then refresh.
      </div>
    )
  }

  const fees = detail.fees
  const currentYear = pickCurrentYear(fees)
  const currentFees = fees.filter((fee) => fee.school_year === currentYear)

  // Les modalités proposées à l'édition suivent la langue de l'établissement :
  // « installments » pour un anglophone, « tranches » pour un francophone ou
  // un bilingue (conformément au choix : rien n'est supprimé de la base).
  const isAnglophone = detail.linguistic_section.toLowerCase().includes('angl')
  const languagePaymentMethods = paymentMethods.filter((label) =>
    isAnglophone
      ? label.toLowerCase().includes('installment')
      : label.toLowerCase().includes('tranche'),
  )
  const editingPaymentMethods =
    languagePaymentMethods.length > 0 ? languagePaymentMethods : paymentMethods

  return (
    <div>
      {/* Bloc titre + sélecteur d'établissement inline */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[22px] font-bold tracking-tight text-[#081220]">
            Fees &amp; Payments
          </h2>
          <p className="mt-1 text-[13px] text-[#5b6670]">
            Tuition fees and payment plans for your establishments.
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

      {/* Quatre cartes de synthèse format dashboard — intégrées par le parent
          (ManagerHomePage) pour rester identiques au dashboard. */}
      {/* Contenu principal : tableau des frais (dominant) + analytique */}
      <section className="mt-[18px] grid grid-cols-1 items-start gap-[18px] xl:grid-cols-[minmax(0,2.05fr)_minmax(320px,1fr)]">
        <div className={`overflow-hidden rounded-[18px] border border-[#e7ece9] bg-white p-4 ${SHADOW_CARD}`}>
          <ManagerFeesSection
            fees={fees}
            establishmentUuid={detail.uuid}
            hasPendingSubmission={detail.has_pending_submission}
            reloadDetail={reloadDetail}
            paymentMethods={editingPaymentMethods}
          />
        </div>

        <div className="space-y-[18px]">
          <div className={`rounded-[18px] border border-[#e7ece9] bg-white p-4 ${SHADOW_CARD}`}>
            <h3 className="text-[15px] font-bold text-[#081220]">Fees by level</h3>
            <p className="mt-0.5 text-[11px] text-[#8a90a0]">
              Current session {currentYear ?? ''}
            </p>
            <div className="mt-4">
              <FeesByLevelBars fees={currentFees} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}