import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// Titre de l'onglet, dans la langue affichée. Avec un titre de page (le nom
// d'un établissement), l'onglet et l'historique disent où l'on est ; sans
// lui, le titre général du site.
export function useDocumentTitle(pageTitle) {
  const { t } = useTranslation()
  const documentTitle = pageTitle ? t('pageDocumentTitle', { page: pageTitle }) : t('documentTitle')

  useEffect(() => {
    document.title = documentTitle
  }, [documentTitle])
}
