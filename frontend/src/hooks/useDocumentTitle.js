import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// Titre de l'onglet, dans la langue affichée. Avec un titre de page (le nom
// d'un établissement), l'onglet et l'historique disent où l'on est ; sans
// lui, le titre général du site. Dans un espace privé, le nombre de
// notifications non lues le précède : « (3) … » se voit depuis un autre onglet.
export function useDocumentTitle(pageTitle, unreadCount = 0) {
  const { t } = useTranslation()
  const siteTitle = pageTitle ? t('pageDocumentTitle', { page: pageTitle }) : t('documentTitle')
  const documentTitle =
    unreadCount > 0 ? t('unreadDocumentTitle', { count: unreadCount, title: siteTitle }) : siteTitle

  useEffect(() => {
    document.title = documentTitle
  }, [documentTitle])
}
