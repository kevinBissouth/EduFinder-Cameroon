import { useEffect, useState } from 'react'
import axios from 'axios'
import { API_URL } from '../constants'

// Méta de référence (types, villes, secteurs…) chargée une seule fois.
// L'erreur est remontée à l'appelant au lieu d'être avalée : les filtres
// vides sans explication sont un piège pour l'utilisateur.
export default function useFiltersMeta() {
  const [meta, setMeta] = useState({ types: [] })
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    axios
      .get(`${API_URL}/filters-meta`)
      .then((response) => {
        if (!cancelled) setMeta(response.data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { meta, error }
}