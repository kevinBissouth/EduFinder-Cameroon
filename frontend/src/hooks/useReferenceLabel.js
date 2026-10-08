import { useCallback, useContext } from 'react'
import { useTranslation } from 'react-i18next'

import { ReferenceLabelsContext } from '../i18n/referenceLabelsContext'

// Donne le libellé d'une valeur de référence dans la langue affichée. La clé
// est la valeur renvoyée par l'API (« Secondary general ») : elle reste
// inchangée partout ailleurs, parce que les règles métier la comparent.
export function useReferenceLabel() {
  const labelsByKind = useContext(ReferenceLabelsContext)
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage

  return useCallback(
    (referenceKind, key) => labelsByKind[referenceKind]?.[key]?.[language] ?? key,
    [labelsByKind, language],
  )
}

// Pour les listes déroulantes : mêmes options {id, name}, nom traduit.
export function translateOptionNames(options, referenceKind, translateReference) {
  return options.map((option) => ({
    ...option,
    name: translateReference(referenceKind, option.name),
  }))
}

// Un niveau s'affiche « cycle — classe ». Le cycle se traduit ; la classe est
// le nom officiel d'un système scolaire (« 6e », « Form 1 ») et reste tel quel.
export function translateLevelOptions(levels, translateReference) {
  return levels.map((level) => ({
    ...level,
    name: level.stage ? `${translateReference('stages', level.stage)} — ${level.label}` : level.name,
  }))
}
