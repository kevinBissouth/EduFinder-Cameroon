import { useCallback, useEffect, useState } from 'react'

import { authedRequest } from '../utils/auth'

export const ACTIVITY_PERIODS_IN_DAYS = [30, 90]

// Historique des visites et demandes de contact pour une adresse d'API
// donnée (un établissement ou toute la plateforme). Sans adresse, rien n'est
// chargé.
export function useActivity(activityUrl) {
  const [periodInDays, setPeriodInDays] = useState(ACTIVITY_PERIODS_IN_DAYS[0])
  const [activity, setActivity] = useState(null)
  const [status, setStatus] = useState('loading')

  const reload = useCallback(async () => {
    if (!activityUrl) return
    setStatus('loading')
    try {
      setActivity(await authedRequest('get', `${activityUrl}?days=${periodInDays}`))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [activityUrl, periodInDays])

  useEffect(() => {
    reload()
  }, [reload])

  return { status, activity, periodInDays, setPeriodInDays, reload }
}
