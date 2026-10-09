import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from '../ui/Button'
import { AmountField } from '../ui/Field'
import OverflowList from '../workspace/OverflowList'
import PagedCards from '../workspace/PagedCards'
import ToggleChipGroup from '../workspace/ToggleChipGroup'
import { toggleValue } from '../workspace/toggleChips'
import { findLatestYear } from './schoolYears'
import { useModificationProposal } from '../../hooks/useModificationProposal'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import { formatAmount } from '../../utils/format'

function hasSameItems(firstList, secondList) {
  return [...firstList].sort().join('|') === [...secondList].sort().join('|')
}

function FeeEditor({ fee, paymentMethods, isSubmitting, onSubmit, onCancel }) {
  const { t } = useTranslation('manager')
  const translateReference = useReferenceLabel()
  const [amountDraft, setAmountDraft] = useState(String(Number(fee.amount)))
  const [selectedMethods, setSelectedMethods] = useState(fee.payment_methods)

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({ amount: Number(amountDraft), paymentMethods: selectedMethods })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-control bg-paper p-4">
      <AmountField
        label={t('fees.amountLabel', { year: fee.school_year })}
        autoFocus
        value={amountDraft}
        onChange={setAmountDraft}
        className="sm:max-w-xs"
      />
      <ToggleChipGroup
        label={t('fees.paymentPlans')}
        options={paymentMethods.map((paymentMethod) => ({
          value: paymentMethod,
          label: translateReference('payment_methods', paymentMethod),
        }))}
        selectedValues={selectedMethods}
        onToggle={(paymentMethod) => setSelectedMethods(toggleValue(selectedMethods, paymentMethod))}
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

const FEES_SHOWN_WHEN_COMPACT = 2
const COMPACT_GRID_CLASSES = 'grid-cols-1 sm:grid-cols-2'
const CURRENT_YEAR_HEADER_CLASS = 'bg-linear-to-br from-primary-deep to-violet-deep'
const PAST_YEAR_HEADER_CLASS = 'bg-ink-soft'

function PaymentPlans({ paymentMethods }) {
  const { t } = useTranslation('manager')
  const translateReference = useReferenceLabel()
  if (paymentMethods.length === 0) {
    return <p className="mt-4 text-sm text-ink-soft">{t('fees.noPaymentPlan')}</p>
  }
  return (
    <ul aria-label={t('fees.paymentPlans')} className="mt-4 flex flex-wrap gap-2">
      {paymentMethods.map((paymentMethod) => (
        <li
          key={paymentMethod}
          className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep"
        >
          {translateReference('payment_methods', paymentMethod)}
        </li>
      ))}
    </ul>
  )
}

// Carte d'un frais : un en-tête coloré avec la classe et l'année (en dégradé
// pour l'année en cours, gris pour les années passées, non modifiables), puis
// le montant en grand et les modalités de paiement.
function FeeCard({ fee, isCurrentYear, isEditing, onEdit, children }) {
  const { t } = useTranslation('manager')
  const translateReference = useReferenceLabel()

  return (
    <li className="flex h-full flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-soft">
      <div
        className={`flex items-start justify-between gap-3 p-5 text-white ${
          isCurrentYear ? CURRENT_YEAR_HEADER_CLASS : PAST_YEAR_HEADER_CLASS
        }`}
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold">{translateReference('stages', fee.stage)}</p>
          <h3 className="mt-1 font-display text-2xl leading-display">{fee.class}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          {fee.school_year}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold text-ink-soft">{t('fees.yearlyFee')}</p>
        <p className="mt-1 font-display text-4xl leading-display text-navy tabular-nums">
          {formatAmount(fee.amount)}{' '}
          <span className="font-sans text-base font-semibold text-ink-soft">FCFA</span>
        </p>
        <PaymentPlans paymentMethods={fee.payment_methods} />
        {children}
        {isCurrentYear && !isEditing && (
          <div className="mt-auto pt-5">
            <Button variant="secondary" aria-label={t('fees.editFee', { className: fee.class })} onClick={onEdit}>
              <Pencil aria-hidden="true" className="size-4" />
              {t('actions.edit')}
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
  const { t } = useTranslation('manager')
  if (!isCompact) {
    return <PagedCards items={fees} gridClassName={gridClassName} renderCard={renderCard} />
  }
  return (
    <OverflowList
      items={fees}
      collapsedCount={FEES_SHOWN_WHEN_COMPACT}
      title={t('fees.title')}
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
  const { t } = useTranslation('manager')
  const [editingLevelId, setEditingLevelId] = useState(null)
  const proposal = useModificationProposal(establishmentUuid, onProposalSubmitted)
  const currentYear = findLatestYear(fees.map((fee) => fee.school_year))

  async function submitFee(fee, { amount, paymentMethods: selectedMethods }) {
    if (!Number.isFinite(amount) || amount <= 0) {
      proposal.showError(t('fees.amountAboveZero'))
      return
    }
    if (amount === Number(fee.amount) && hasSameItems(fee.payment_methods, selectedMethods)) {
      proposal.showInfo(t('fees.unchanged'))
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
        {t('fees.empty')}
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
