import { useCallback, useEffect, useState } from 'react'

import { authedRequest } from '../utils/auth'

// Détail complet d'un établissement géré, récupéré côté responsable (visible
// quelle que soit la visibilité). Rechargeable après une proposition.
export function useManagerEstablishment(uuid) {
  const [detail, setDetail] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | ready | error

  const load = useCallback(async () => {
    if (!uuid) {
      setDetail(null)
      setStatus('idle')
      return
    }
    setStatus('loading')
    try {
      const data = await authedRequest('get', `/my/establishments/${uuid}`)
      setDetail(data)
      setStatus('ready')
    } catch {
      setDetail(null)
      setStatus('error')
    }
  }, [uuid])

  useEffect(() => {
    load()
  }, [load])

  return { detail, status, reload: load }
}
