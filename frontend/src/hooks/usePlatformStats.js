import { useEffect, useState } from 'react'
import axios from 'axios'

import { API_URL } from '../constants'

// Compteurs globaux de la plateforme, chargés une seule fois : ils alimentent
// Hero et GlobalPicture sans que le front télécharge toutes les fiches.
// L'erreur est exposée pour que l'UI puisse prévenir au lieu d'afficher 0.
export function usePlatformStats() {
  const [stats, setStats] = useState({
    institutions: 0,
    cities: 0,
    regions: 0,
    fee_plans: 0,
    exam_results: 0,
  })
  const [error, setError] = useState(false)

  useEffect(() => {
    axios
      .get(`${API_URL}/stats`)
      .then((response) => setStats(response.data))
      .catch(() => setError(true))
  }, [])

  return { stats, error }
}