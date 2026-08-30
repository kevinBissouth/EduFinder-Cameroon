import { Pencil, Check, X, Lock, WalletCards } from 'lucide-react'
import { useState } from 'react'

import { authedRequest } from '../../utils/auth'

// Année de référence pour l'édition des frais : la session la plus récente
// renseignée par l'établissement (les années précédentes restent en lecture
// seule, l'historique devant être conservé). Le format "YYYY-YYYY" étant
// fixe, un tri lexicographique donne l'ordre chronologique sans NaN.
const pickCurrentYear = (fees) =>
  fees.length ? [...fees.map((fee) => fee.school_year)].sort().at(-1) : null

// Tableau des frais avec édition par classe : chaque ligne de la session en
// cours porte son propre crayon ; la sauvegarde soumet une proposition de
// modification isolée pour cette seule classe (validation administrateur).
// Le montant et les modalités de paiement (labels de payment_methods) sont
// modifiables ensemble dans la même édition.
export default function ManagerFeesSection({
  fees,
  establishmentUuid,
  hasPendingSubmission,
  reloadDetail,
  paymentMethods = [],
}) {
  const [editingLevelId, setEditingLevelId] = useState(null)
  const [draftAmount, setDraftAmount] = useState('')
  const [draftPaymentMethods, setDraftPaymentMethods] = useState([])
  const [notice, setNotice] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const currentYear = pickCurrentYear(fees)

  const startEditing = (fee) => {
    setEditingLevelId(fee.id_level)
    setDraftAmount(String(fee.amount))
    setDraftPaymentMethods([...fee.payment_methods])
    setNotice(null)
    setSubmitError(null)
  }

  const cancelEditing = () => {
    setEditingLevelId(null)
    setDraftAmount('')
    setDraftPaymentMethods([])
    setNotice(null)
    setSubmitError(null)
  }

  const togglePaymentMethod = (label) => {
    setDraftPaymentMethods((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    )
  }

  const submitProposal = async (fee) => {
    const newAmount = Number(draftAmount)
    if (!Number.isFinite(newAmount) || newAmount <= 0) {
      setSubmitError('Enter a positive amount.')
      return
    }
    const methodsUnchanged =
      [...fee.payment_methods].sort().join('|') ===
      [...draftPaymentMethods].sort().join('|')
    if (newAmount === Number(fee.amount) && methodsUnchanged) {
      setNotice('No change — the amount and payment plans are already the same.')
      setEditingLevelId(null)
      setDraftAmount('')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await authedRequest('post', `/my/establishments/${establishmentUuid}/modification-proposals`, {
        fees: [
          {
            id_level: fee.id_level,
            school_year: currentYear,
            amount: newAmount,
            payment_methods: draftPaymentMethods,
          },
        ],
      })
      setNotice('Fee submitted for review.')
      setEditingLevelId(null)
      setDraftAmount('')
      setDraftPaymentMethods([])
      reloadDetail()
    } catch (error) {
      if (error.response?.status === 409) {
        setSubmitError('A modification is already pending for this school.')
      } else {
        setSubmitError('Unable to submit — check the amount and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (fees.length === 0) {
    return (
      <p className="rounded-2xl bg-[#f6faf8] px-4 py-4 text-[13px] text-[#8a90a0]">
        No fees set yet — add them so families can compare.
      </p>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a90a0]">
          Current session {currentYear}
        </p>
        {hasPendingSubmission && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdf3dd] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#8a5b00]">
            <Lock size={11} /> Locked while a proposal is pending
          </span>
        )}
      </div>

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

      <div className="mt-3 overflow-x-auto rounded-2xl border border-[#dcebe3]">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="bg-[#f3faf6] text-[11px] uppercase tracking-wide text-[#8a90a0]">
              <th className="px-3 py-2 font-semibold">Level</th>
              <th className="px-3 py-2 font-semibold">Year</th>
              <th className="px-3 py-2 text-right font-semibold">Amount</th>
              <th className="px-3 py-2 font-semibold">Payment</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dcebe3]">
            {fees.map((fee) => {
              const isCurrent = fee.school_year === currentYear
              const isEditing = isCurrent && editingLevelId === fee.id_level
              return (
                <tr
                  key={`${fee.id_level}-${fee.school_year}`}
                  className={isCurrent ? 'bg-[#fafffd]' : undefined}
                >
                  <td className="px-3 py-2 font-medium text-[#081220]">
                    {fee.class}
                    <span className="block text-[11px] font-normal text-[#8a90a0]">{fee.stage}</span>
                  </td>
                  <td className="px-3 py-2 text-[#6e6e6e]">{fee.school_year}</td>
                  <td className="px-3 py-2 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          autoFocus
                          value={draftAmount}
                          onChange={(event) => setDraftAmount(event.target.value)}
                          className="w-32 rounded-lg border border-[#d9a406] bg-white px-2 py-1.5 text-right font-semibold text-[#0a5e3d] shadow-sm outline-none transition-colors focus:border-[#f2c14e]"
                        />
                        <button
                          onClick={() => submitProposal(fee)}
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
                        {Number(fee.amount).toLocaleString()} FCFA
                      </span>
                    )}
                    {isCurrent && !isEditing && (
                      <span className="ml-2 rounded-full bg-[#eef4f0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0d7a4f]">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {paymentMethods.map((label) => {
                          const isSelected = draftPaymentMethods.includes(label)
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => togglePaymentMethod(label)}
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                isSelected
                                  ? 'bg-[#0d7a4f] text-white'
                                  : 'border border-[#dcebe3] bg-white text-[#5b6670] hover:border-[#0d7a4f] hover:text-[#0d7a4f]'
                              }`}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    ) : fee.payment_methods.length > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#eef4f0] px-2.5 py-0.5 text-[11px] font-semibold text-[#0d7a4f]">
                        <WalletCards size={11} strokeWidth={2} />
                        {fee.payment_methods.length}{' '}
                        {fee.payment_methods.length === 1 ? 'plan' : 'plans'}
                      </span>
                    ) : (
                      <span className="text-[12px] text-[#98a2ac]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isCurrent && !hasPendingSubmission && !isEditing && (
                      <button
                        onClick={() => startEditing(fee)}
                        title="Edit this class fee"
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

      {!hasPendingSubmission && editingLevelId === null && (
        <p className="mt-2.5 text-[11px] text-[#8a90a0]">
          Click the pencil next to a class to change its {currentYear} amount or payment plans — a
          super admin must approve the change before it goes live.
        </p>
      )}
      {editingLevelId !== null && (
        <p className="mt-2.5 text-[11px] text-[#8a90a0]">
          Submitting creates a review proposal for this class only.
        </p>
      )}
    </div>
  )
}