import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'

import { API_URL } from '../constants'

// Résumés de tous les établissements publiés, sans filtre : la page des
// favoris y retrouve les siens, et sait ainsi lesquels ne sont plus publiés.
export function usePublishedSchools() {
  const [catalog, setCatalog] = useState({ status: 'loading', schools: [] })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let isCancelled = false
    setCatalog((current) => ({ ...current, status: 'loading' }))
    axios
      .get(`${API_URL}/institutions`)
      .then((response) => {
        if (!isCancelled) setCatalog({ status: 'success', schools: response.data })
      })
      .catch(() => {
        if (!isCancelled) setCatalog({ status: 'error', schools: [] })
      })
    return () => {
      isCancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => setAttempt((current) => current + 1), [])

  return { ...catalog, retry }
}
