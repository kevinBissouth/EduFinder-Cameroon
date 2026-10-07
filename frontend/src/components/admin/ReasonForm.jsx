import { useState } from 'react'

import Button from '../ui/Button'
import { TextAreaField } from '../ui/Field'
import { isReasonValid } from './decisionRules'

const REASON_ROWS = 3

// Motif obligatoire d'un refus ou d'une suspension : le responsable le lit,
// donc l'envoi reste bloqué tant qu'il est vide.
function ReasonForm({ label, confirmLabel, isBusy, onConfirm, onCancel }) {
  const [reason, setReason] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    onConfirm(reason.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-control bg-danger-soft p-4">
      <TextAreaField
        label={label}
        rows={REASON_ROWS}
        autoFocus
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={isBusy || !isReasonValid(reason)}
          className="bg-danger-deep shadow-none hover:bg-danger"
        >
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isBusy}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default ReasonForm
