import { useTranslation } from 'react-i18next'

import { pickSchoolText } from '../utils/schoolText'

// Lecture d'un texte libre d'un établissement dans la langue affichée. Le
// crochet suit le changement de langue : la fiche se redessine avec l'autre
// version sans nouvelle requête.
export function useSchoolText(school) {
  const { i18n } = useTranslation()
  return (fieldName) => pickSchoolText(school, fieldName, i18n.resolvedLanguage)
}
