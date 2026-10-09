import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'

import { API_URL } from '../constants'

const NOT_FOUND_STATUS = 404

// Un établissement introuvable (inconnu, ou plus publié) n'est pas une panne :
// il est simplement absent de la comparaison. Une vraie panne est notée à
// part, pour distinguer « celui-ci manque » de « le serveur ne répond pas ».
function fetchSchool(schoolId) {
  return axios
    .get(`${API_URL}/institutions/${schoolId}`)
    .then((response) => ({ school: response.data, hasFailed: false }))
    .catch((error) => ({
      school: null,
      hasFailed: error.response?.status !== NOT_FOUND_STATUS,
    }))
}

// Charge les fiches à comparer. Contrairement à la page d'une fiche, rien
// n'est signalé au suivi des visites : mettre un établissement dans un
// tableau n'est pas le consulter, et gonflerait les chiffres du responsable.
export function useComparedSchools(schoolIds) {
  const [comparison, setComparison] = useState({ status: 'loading', schools: [], missingCount: 0 })
  const [attempt, setAttempt] = useState(0)
  const requestedIds = schoolIds.join(',')

  useEffect(() => {
    const wantedIds = requestedIds ? requestedIds.split(',') : []
    let isCancelled = false
    setComparison((current) => ({ ...current, status: 'loading' }))
    Promise.all(wantedIds.map(fetchSchool)).then((results) => {
      if (isCancelled) return
      const schools = results.map((result) => result.school).filter(Boolean)
      // Si rien ne s'est chargé et qu'au moins une requête est tombée en
      // panne, c'est le serveur : je propose de réessayer. Si une partie est
      // arrivée, j'affiche ce que j'ai et je signale les absents.
      const isServerDown = schools.length === 0 && results.some((result) => result.hasFailed)
      setComparison({
        status: isServerDown ? 'error' : 'success',
        schools,
        missingCount: results.length - schools.length,
      })
    })
    return () => {
      isCancelled = true
    }
  }, [requestedIds, attempt])

  const retry = useCallback(() => setAttempt((current) => current + 1), [])

  return { ...comparison, retry }
}
