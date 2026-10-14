import { useContext } from 'react'
import { useTranslation } from 'react-i18next'

import { ReferenceLabelsContext } from '../i18n/referenceLabelsContext'
import { findHeadTitle } from '../utils/headTitle'

// Lecture du titre du chef d'établissement dans la langue affichée ; suit le
// changement de langue comme les autres textes de la fiche.
export function useHeadTitle() {
  const labelsByKind = useContext(ReferenceLabelsContext)
  const { i18n } = useTranslation()

  return (school) => findHeadTitle(school, labelsByKind.head_titles, i18n.resolvedLanguage)
}
