import { useEffect, useState } from 'react'
import axios from 'axios'

import { ReferenceLabelsContext } from './referenceLabelsContext'
import { API_URL } from '../constants'

// Libellés français et anglais des listes de référence (types, régions,
// filières…), chargés une seule fois. Tant qu'ils ne sont pas arrivés, ou si
// la requête échoue, chaque valeur s'affiche avec sa clé d'origine : le site
// reste utilisable, seulement moins bien traduit.
function ReferenceLabelsProvider({ children }) {
  const [labelsByKind, setLabelsByKind] = useState({})

  useEffect(() => {
    let isCancelled = false
    axios
      .get(`${API_URL}/reference-labels`)
      .then((response) => {
        if (!isCancelled) setLabelsByKind(response.data)
      })
      .catch(() => {
        if (!isCancelled) setLabelsByKind({})
      })
    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <ReferenceLabelsContext.Provider value={labelsByKind}>{children}</ReferenceLabelsContext.Provider>
  )
}

export default ReferenceLabelsProvider
