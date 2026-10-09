import { useContext } from 'react'

import { SessionContext } from '../session/sessionContext'

export function useSession() {
  return useContext(SessionContext)
}
