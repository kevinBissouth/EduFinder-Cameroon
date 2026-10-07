import { useState } from 'react'
import { Ban, RotateCcw } from 'lucide-react'

import Button from '../ui/Button'
import Notice from '../workspace/Notice'
import { useToast } from '../workspace/toastContext'
import ReasonForm from './ReasonForm'
import { readApiErrorMessage } from '../../utils/apiError'
import { authedRequest } from '../../utils/auth'

const ACTION_BY_STATUS = { published: 'suspend', suspended: 'reactivate' }
const SUCCESS_MESSAGES = {
  suspend: 'School suspended. Its managers have been notified.',
  reactivate: 'School reactivated. Its managers have been notified.',
}

function ReactivationConfirm({ isBusy, onConfirm, onCancel }) {
  return (
    <div className="space-y-3 rounded-control bg-muted p-4">
      <p className="text-sm text-navy">This school becomes visible to the public again.</p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={isBusy} onClick={onConfirm}>
          {isBusy ? 'Reactivating…' : 'Reactivate the school'}
        </Button>
        <Button variant="secondary" disabled={isBusy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

// Suspendre retire la fiche du site public : je passe toujours par une
// confirmation, jamais par un simple clic. Seuls un établissement publié
// (à suspendre) ou suspendu (à réactiver) ont une action.
function EstablishmentStatusActions({ establishment, onStatusChanged }) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const showToast = useToast()
  const availableAction = ACTION_BY_STATUS[establishment.establishment_status]

  async function applyAction(requestBody) {
    setIsBusy(true)
    setErrorMessage('')
    try {
      await authedRequest(
        'post',
        `/admin/establishments/${establishment.establishment_uuid}/${availableAction}`,
        requestBody,
      )
    } catch (error) {
      setErrorMessage(readApiErrorMessage(error))
      setIsBusy(false)
      return
    }
    showToast({ tone: 'success', message: SUCCESS_MESSAGES[availableAction] })
    await onStatusChanged()
  }

  if (!availableAction) return null

  if (!isConfirming) {
    const isSuspension = availableAction === 'suspend'
    return (
      <Button variant="secondary" onClick={() => setIsConfirming(true)}>
        {isSuspension ? (
          <Ban aria-hidden="true" className="size-4" />
        ) : (
          <RotateCcw aria-hidden="true" className="size-4" />
        )}
        {isSuspension ? 'Suspend the school' : 'Reactivate the school'}
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      {errorMessage && <Notice tone="danger">{errorMessage}</Notice>}
      {availableAction === 'suspend' ? (
        <ReasonForm
          label="Reason for the suspension (the school leaves the public site)"
          confirmLabel={isBusy ? 'Suspending…' : 'Suspend the school'}
          isBusy={isBusy}
          onConfirm={(reason) => applyAction({ reason })}
          onCancel={() => setIsConfirming(false)}
        />
      ) : (
        <ReactivationConfirm
          isBusy={isBusy}
          onConfirm={() => applyAction(undefined)}
          onCancel={() => setIsConfirming(false)}
        />
      )}
    </div>
  )
}

export default EstablishmentStatusActions
