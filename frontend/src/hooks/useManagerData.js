import { useCallback, useEffect, useState } from 'react'

import useFiltersMeta from './useFiltersMeta'
import { authedRequest } from '../utils/auth'

// État central de l'espace responsable : fiches gérées, historique des
// soumissions et méta de référence (villes, types, niveaux…). Un seul
// refresh() après chaque proposition pour tout remettre d'aplomb.
export function useManagerData() {
  const { meta, error: metaError } = useFiltersMeta()
  const [establishments, setEstablishments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error

  const refresh = useCallback(async () => {
    try {
      const [myEstablishments, mySubmissions] = await Promise.all([
        authedRequest('get', '/my/establishments'),
        authedRequest('get', '/my/submissions'),
      ])
      setEstablishments(myEstablishments)
      setSubmissions(mySubmissions)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function submitCreationProposal(payload) {
    // Le serveur renvoie 201 + uuids ; on rafraîchit ensuite listes et statuts.
    const result = await authedRequest(
      'post',
      '/establishments/proposals',
      payload,
    )
    await refresh()
    return result
  }

  async function submitModificationProposal(establishmentUuid, payload) {
    const result = await authedRequest(
      'post',
      `/my/establishments/${establishmentUuid}/modification-proposals`,
      payload,
    )
    await refresh()
    return result
  }

  // Traduction des erreurs API en message affichable dans le formulaire.
  function extractServerErrorMessage(error) {
    const detail = error?.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).join(' · ')
    }
    return 'Something went wrong. Please check your input and try again.'
  }

  return {
    meta,
    metaError,
    establishments,
    submissions,
    status,
    refresh,
    submitCreationProposal,
    submitModificationProposal,
    extractServerErrorMessage,
  }
}
