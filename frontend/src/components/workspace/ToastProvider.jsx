import { useCallback, useState } from 'react'
import { CircleAlert, CircleCheck, X } from 'lucide-react'

import { ToastContext } from './toastContext'

const TOAST_DURATION_MS = 6000
const TONE_PRESENTATION = {
  success: { Icon: CircleCheck, iconClass: 'text-accent' },
  danger: { Icon: CircleAlert, iconClass: 'text-danger' },
}

function Toast({ toast, onDismiss }) {
  const { Icon, iconClass } = TONE_PRESENTATION[toast.tone]

  return (
    <li
      role={toast.tone === 'danger' ? 'alert' : 'status'}
      className="pointer-events-auto flex animate-settle items-start gap-3 rounded-control bg-navy p-4 text-white shadow-raised [--focus-ring:var(--color-accent)]"
    >
      <Icon aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${iconClass}`} />
      <p className="flex-1 text-sm text-pretty">{toast.message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
        className="-m-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-navy-soft hover:text-white"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </li>
  )
}

// Messages temporaires qui confirment une action ou signalent son échec. Ils
// s'empilent au-dessus de la barre d'onglets et disparaissent seuls.
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback(
    (toastId) => setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId)),
    [],
  )

  const showToast = useCallback(
    ({ tone, message }) => {
      const toastId = crypto.randomUUID()
      setToasts((currentToasts) => [...currentToasts, { id: toastId, tone, message }])
      setTimeout(() => dismissToast(toastId), TOAST_DURATION_MS)
    },
    [dismissToast],
  )

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ul className="pointer-events-none fixed inset-x-4 bottom-24 z-60 mx-auto flex max-w-md flex-col gap-2 lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </ul>
    </ToastContext.Provider>
  )
}

export default ToastProvider
