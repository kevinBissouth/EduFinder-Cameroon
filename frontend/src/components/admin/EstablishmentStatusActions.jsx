import { useState } from 'react'
import { Ban, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from '../ui/Button'
import Notice from '../workspace/Notice'
import { useToast } from '../workspace/toastContext'
import ReasonForm from './ReasonForm'
import { readApiErrorMessage } from '../../utils/apiError'
import { authedRequest } from '../../utils/auth'

const ACTION_BY_STATUS = { published: 'suspend', suspended: 'reactivate' }
const SUCCESS_MESSAGE_KEYS = {
  suspend: 'schools.suspendedMessage',
  reactivate: 'schools.reactivatedMessage',
}

function ReactivationConfirm({ isBusy, onConfirm, onCancel }) {
  const { t } = useTranslation('admin')

  return (
    <div className="space-y-3 rounded-control bg-muted p-4">
      <p className="text-sm text-navy">{t('schools.visibleAgain')}</p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={isBusy} onClick={onConfirm}>
          {isBusy ? t('schools.reactivating') : t('schools.reactivate')}
        </Button>
        <Button variant="secondary" disabled={isBusy} onClick={onCancel}>
          {t('manager:actions.cancel')}
        </Button>
      </div>
    </div>
  )
}

// Suspendre retire la fiche du site public : je passe toujours par une
// confirmation, jamais par un simple clic. Seuls un établissement publié
// (à suspendre) ou suspendu (à réactiver) ont une action.
function EstablishmentStatusActions({ establishment, onStatusChanged }) {
  const { t } = useTranslation('admin')
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
    showToast({ tone: 'success', message: t(SUCCESS_MESSAGE_KEYS[availableAction]) })
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
        {isSuspension ? t('schools.suspend') : t('schools.reactivate')}
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      {errorMessage && <Notice tone="danger">{errorMessage}</Notice>}
      {availableAction === 'suspend' ? (
        <ReasonForm
          label={t('schools.suspensionReasonLabel')}
          confirmLabel={isBusy ? t('schools.suspending') : t('schools.suspend')}
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
