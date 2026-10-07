import { useState } from 'react'
import { Pencil } from 'lucide-react'

import Button from '../ui/Button'
import { TextField } from '../ui/Field'
import OverflowList from '../workspace/OverflowList'
import PagedCards from '../workspace/PagedCards'
import ToggleChipGroup from '../workspace/ToggleChipGroup'
import { toChipOptions, toggleValue } from '../workspace/toggleChips'
import { findLatestYear } from './schoolYears'
import { useModificationProposal } from '../../hooks/useModificationProposal'

function hasSameItems(firstList, secondList) {
  return [...firstList].sort().join('|') === [...secondList].sort().join('|')
}

function FeeEditor({ fee, paymentMethods, isSubmitting, onSubmit, onCancel }) {
  const [amountDraft, setAmountDraft] = useState(String(Number(fee.amount)))
  const [selectedMethods, setSelectedMethods] = useState(fee.payment_methods)

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({ amount: Number(amountDraft), paymentMethods: selectedMethods })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-control bg-paper p-4">
      <TextField
        label={`Amount for ${fee.school_year} (FCFA)`}
        type="number"
        min="1"
        step="any"
        autoFocus
        value={amountDraft}
        onChange={(event) => setAmountDraft(event.target.value)}
        className="sm:max-w-xs"
      />
      <ToggleChipGroup
        label="Payment plans"
        options={toChipOptions(paymentMethods)}
        selectedValues={selectedMethods}
        onToggle={(paymentMethod) => setSelectedMethods(toggleValue(selectedMethods, paymentMethod))}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          Send for review
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

const FEES_SHOWN_WHEN_COMPACT = 2
const COMPACT_GRID_CLASSES = 'grid-cols-1 sm:grid-cols-2'
const CURRENT_YEAR_HEADER_CLASS = 'bg-linear-to-br from-primary-deep to-violet-deep'
const PAST_YEAR_HEADER_CLASS = 'bg-ink-soft'

function PaymentPlans({ paymentMethods }) {
  if (paymentMethods.length === 0) {
    return <p className="mt-4 text-sm text-ink-soft">No payment plan</p>
  }
  return (
    <ul aria-label="Payment plans" className="mt-4 flex flex-wrap gap-2">
      {paymentMethods.map((paymentMethod) => (
        <li
          key={paymentMethod}
          className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep"
        >
          {paymentMethod}
        </li>
      ))}
    </ul>
  )
}

// Carte d'un frais : un en-tête coloré avec la classe et l'année (en dégradé
// pour l'année en cours, gris pour les années passées, non modifiables), puis
// le montant en grand et les modalités de paiement.
function FeeCard({ fee, isCurrentYear, isEditing, onEdit, children }) {
  return (
    <li className="flex h-full flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-soft">
      <div
        className={`flex items-start justify-between gap-3 p-5 text-white ${
          isCurrentYear ? CURRENT_YEAR_HEADER_CLASS : PAST_YEAR_HEADER_CLASS
        }`}
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold">{fee.stage}</p>
          <h3 className="mt-1 font-display text-2xl leading-display">{fee.class}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          {fee.school_year}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold text-ink-soft">Yearly fee</p>
        <p className="mt-1 font-display text-4xl leading-display text-navy tabular-nums">
          {Number(fee.amount).toLocaleString('en-US')}{' '}
          <span className="font-sans text-base font-semibold text-ink-soft">FCFA</span>
        </p>
        <PaymentPlans paymentMethods={fee.payment_methods} />
        {children}
        {isCurrentYear && !isEditing && (
          <div className="mt-auto pt-5">
            <Button variant="secondary" aria-label={`Edit the ${fee.class} fee`} onClick={onEdit}>
              <Pencil aria-hidden="true" className="size-4" />
              Edit
            </Button>
          </div>
        )}
      </div>
    </li>
  )
}

// Dans la fiche détaillée, seuls les premiers frais sont affichés et le reste
// s'ouvre à la demande ; dans la vue des frais, ils sont paginés.
function FeeCards({ fees, gridClassName, isCompact, renderCard }) {
  if (!isCompact) {
    return <PagedCards items={fees} gridClassName={gridClassName} renderCard={renderCard} />
  }
  return (
    <OverflowList
      items={fees}
      collapsedCount={FEES_SHOWN_WHEN_COMPACT}
      title="School fees"
      modalSize="lg"
      renderItems={(shownFees) => (
        <ul className={`grid gap-4 ${COMPACT_GRID_CLASSES}`}>{shownFees.map(renderCard)}</ul>
      )}
    />
  )
}

// Frais d'une fiche. Seule l'année la plus récente se modifie : les années
// passées restent affichées telles quelles, l'historique des montants doit
// être conservé (règle 4 du cahier des besoins).
function ManagerFeesSection({
  fees,
  establishmentUuid,
  paymentMethods,
  gridClassName,
  isCompact = false,
  onProposalSubmitted,
}) {
  const [editingLevelId, setEditingLevelId] = useState(null)
  const proposal = useModificationProposal(establishmentUuid, onProposalSubmitted)
  const currentYear = findLatestYear(fees.map((fee) => fee.school_year))

  async function submitFee(fee, { amount, paymentMethods: selectedMethods }) {
    if (!Number.isFinite(amount) || amount <= 0) {
      proposal.showError('Enter an amount above zero.')
      return
    }
    if (amount === Number(fee.amount) && hasSameItems(fee.payment_methods, selectedMethods)) {
      proposal.showInfo('Nothing was sent: the amount and payment plans are unchanged.')
      setEditingLevelId(null)
      return
    }
    const isSent = await proposal.submitProposal({
      fees: [
        {
          id_level: fee.id_level,
          school_year: fee.school_year,
          amount,
          payment_methods: selectedMethods,
        },
      ],
    })
    if (isSent) setEditingLevelId(null)
  }

  const renderFeeCard = (fee) => {
    const isCurrentYear = fee.school_year === currentYear
    const isEditing = isCurrentYear && editingLevelId === fee.id_level
    return (
      <FeeCard
        key={`${fee.id_level}-${fee.school_year}`}
        fee={fee}
        isCurrentYear={isCurrentYear}
        isEditing={isEditing}
        onEdit={() => setEditingLevelId(fee.id_level)}
      >
        {isEditing && (
          <FeeEditor
            fee={fee}
            paymentMethods={paymentMethods}
            isSubmitting={proposal.isSubmitting}
            onSubmit={(feeDraft) => submitFee(fee, feeDraft)}
            onCancel={() => setEditingLevelId(null)}
          />
        )}
      </FeeCard>
    )
  }

  if (fees.length === 0) {
    return (
      <p className="rounded-panel border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-soft">
        No fee is recorded yet. Use “Propose changes” on the school to add them.
      </p>
    )
  }

  return (
    <FeeCards
      fees={fees}
      gridClassName={gridClassName}
      isCompact={isCompact}
      renderCard={renderFeeCard}
    />
  )
}

export default ManagerFeesSection
