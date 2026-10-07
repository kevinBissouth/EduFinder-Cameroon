import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

// showToast({ tone: 'success' | 'danger', message })
export function useToast() {
  return useContext(ToastContext)
}
