import { useEffect, useState } from 'react'
import axios from 'axios'

import { API_URL } from '../constants'

// Chargement de la fiche d'un établissement ; l'annulation évite qu'une
// réponse tardive d'une école précédente écrase la fiche courante. Sans
// identifiant, aucune requête n'est lancée.
export function useSchoolProfile(schoolId) {
  const [institution, setInstitution] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!schoolId) {
      setInstitution(null)
      setStatus('loading')
      return undefined
    }
    let cancelled = false
    setStatus('loading')
    axios
      .get(`${API_URL}/institutions/${schoolId}`)
      .then((response) => {
        if (cancelled) return
        setInstitution(response.data)
        setStatus('success')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [schoolId])

  return { institution, status }
}