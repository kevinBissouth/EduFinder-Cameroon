import { useCallback, useMemo, useState } from 'react'

import { SchoolSelectionContext } from './schoolSelectionContext'
import { isComparisonFull, normalizeComparedIds } from '../../utils/comparison'
import { readStoredList, writeStoredList } from '../../utils/storedList'

const COMPARED_STORAGE_KEY = 'edufinder.compared'
const SAVED_STORAGE_KEY = 'edufinder.saved'

function toggleId(schoolIds, schoolId) {
  return schoolIds.includes(schoolId)
    ? schoolIds.filter((listedId) => listedId !== schoolId)
    : [...schoolIds, schoolId]
}

// Sélection à comparer et favoris du visiteur, partagés par toutes les pages
// publiques et mémorisés dans son navigateur : ils survivent au rechargement
// sans qu'il ait besoin d'un compte.
function SchoolSelectionProvider({ children }) {
  const [comparedIds, setComparedIds] = useState(() =>
    normalizeComparedIds(readStoredList(COMPARED_STORAGE_KEY)),
  )
  const [savedIds, setSavedIds] = useState(() => readStoredList(SAVED_STORAGE_KEY))
  // Vrai juste après un ajout refusé parce que la comparaison est pleine : la
  // barre de sélection l'explique, puis le message disparaît au geste suivant.
  const [wasAdditionRefused, setWasAdditionRefused] = useState(false)

  const replaceCompared = useCallback((schoolIds) => {
    const normalizedIds = normalizeComparedIds(schoolIds)
    writeStoredList(COMPARED_STORAGE_KEY, normalizedIds)
    setComparedIds(normalizedIds)
    setWasAdditionRefused(false)
  }, [])

  const toggleCompared = useCallback(
    (schoolId) => {
      if (!comparedIds.includes(schoolId) && isComparisonFull(comparedIds)) {
        setWasAdditionRefused(true)
        return
      }
      replaceCompared(toggleId(comparedIds, schoolId))
    },
    [comparedIds, replaceCompared],
  )

  const replaceSaved = useCallback((schoolIds) => {
    writeStoredList(SAVED_STORAGE_KEY, schoolIds)
    setSavedIds(schoolIds)
  }, [])

  const toggleSaved = useCallback(
    (schoolId) => replaceSaved(toggleId(savedIds, schoolId)),
    [savedIds, replaceSaved],
  )

  const selection = useMemo(
    () => ({
      comparedIds,
      savedIds,
      wasAdditionRefused,
      toggleCompared,
      replaceCompared,
      toggleSaved,
      replaceSaved,
    }),
    [comparedIds, savedIds, wasAdditionRefused, toggleCompared, replaceCompared, toggleSaved, replaceSaved],
  )

  return (
    <SchoolSelectionContext.Provider value={selection}>{children}</SchoolSelectionContext.Provider>
  )
}

export default SchoolSelectionProvider
