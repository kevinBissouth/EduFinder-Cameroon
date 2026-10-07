import { useState } from 'react'
import { Ban, RotateCcw } from 'lucide-react'

import { authedRequest } from '../../utils/auth'

// Même seuil que le schéma serveur (SuspensionInput) : le bouton reste
// désactivé tant que le motif serait refusé en 422.
const MINIMUM_REASON_LENGTH = 3

const STATUS_ACTIONS = {
  suspend: {
    confirmLabel: 'Confirm suspension',
    busyLabel: 'Suspending…',
    failureMessage: 'Suspension failed.',
    warning: 'This establishment will no longer be visible to the public.',
    panelStyle: 'border-[#ff6b6b]/30 bg-[rgba(255,107,107,0.08)]',
    confirmStyle: 'bg-[linear-gradient(135deg,#dc2626,#ff6b6b)]',
  },
  reactivate: {
    confirmLabel: 'Confirm reactivation',
    busyLabel: 'Reactivating…',
    failureMessage: 'Reactivation failed.',
    warning: 'This establishment will be visible to the public again.',
    panelStyle: 'border-[#34d399]/30 bg-[rgba(52,211,153,0.08)]',
    confirmStyle: 'bg-[linear-gradient(135deg,#059669,#34d399)]',
  },
}

// Suspension / réactivation d'un établissement depuis sa fenêtre de détail.
// Chaque action passe par un panneau de confirmation : suspendre retire la
// fiche du site public, je ne veux pas que ça parte sur un clic accidentel.
export default function EstablishmentStatusActions({ item, onStatusChanged }) {
  const [openAction, setOpenAction] = useState(null) // null | 'suspend' | 'reactivate'
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState('')

  const availableAction = { published: 'suspend', suspended: 'reactivate' }[
    item.establishment_status
  ]
  if (!availableAction) return null

  const trimmedReason = reason.trim()
  const requiresReason = openAction === 'suspend'
  const canConfirm =
    !busy && (!requiresReason || trimmedReason.length >= MINIMUM_REASON_LENGTH)

  async function confirmAction() {
    setBusy(true)
    setServerError('')
    try {
      await authedRequest(
        'post',
        `/admin/establishments/${item.establishment_uuid}/${openAction}`,
        requiresReason ? { reason: trimmedReason } : undefined,
      )
      await onStatusChanged()
    } catch (error) {
      // Le détail d'une 422 est un tableau d'erreurs, pas un texte : je
      // n'affiche le message serveur que s'il est lisible tel quel.
      const serverDetail = error?.response?.data?.detail
      setServerError(
        typeof serverDetail === 'string'
          ? serverDetail
          : STATUS_ACTIONS[openAction].failureMessage,
      )
      setBusy(false)
    }
  }

  return (
    <div className="border-t border-white/10 pt-4">
      {item.suspension_reason && (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
            Suspension reason
          </p>
          <p className="mt-1 break-words text-[13px] text-white/85">{item.suspension_reason}</p>
        </div>
      )}

      {serverError && (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-300">
          {serverError}
        </div>
      )}

      {openAction ? (
        <div className={`rounded-xl border p-4 ${STATUS_ACTIONS[openAction].panelStyle}`}>
          <p className="text-[13px] text-white/85">{STATUS_ACTIONS[openAction].warning}</p>
          {requiresReason && (
            <>
              <label
                htmlFor="suspension-reason"
                className="mb-2 mt-3 block text-[12px] font-medium text-[#ff9d8f]"
              >
                Reason for suspension (required)
              </label>
              <textarea
                id="suspension-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                placeholder="Explain why this establishment is suspended…"
                className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-[#f5f5f4] placeholder:text-white/30 focus:border-[#ff6b6b] focus:outline-none"
              />
            </>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpenAction(null)}
              disabled={busy}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-white/70 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmAction}
              disabled={!canConfirm}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${STATUS_ACTIONS[openAction].confirmStyle}`}
            >
              {busy ? STATUS_ACTIONS[openAction].busyLabel : STATUS_ACTIONS[openAction].confirmLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          {availableAction === 'suspend' ? (
            <button
              type="button"
              onClick={() => setOpenAction('suspend')}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] font-medium text-[#ff9d8f] transition-colors hover:border-[#ff6b6b]/50"
            >
              <Ban size={16} /> Suspend
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOpenAction('reactivate')}
              className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#059669,#34d399)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(5,150,105,0.3)] transition-all hover:-translate-y-0.5"
            >
              <RotateCcw size={16} /> Reactivate
            </button>
          )}
        </div>
      )}
    </div>
  )
}
