const TRANSLATION_SUFFIX = '_translation'

// Le texte d'un établissement à afficher dans la langue du site. Un
// établissement écrit dans une langue (content_language) et peut fournir une
// version dans l'autre. Quand cette version manque, je rends le texte
// d'origine avec sa langue (writtenIn), pour que la page puisse le signaler.
// Une fiche sans langue déclarée est affichée telle quelle, sans mention.
export function pickSchoolText(school, fieldName, siteLanguageCode) {
  const originalText = school[fieldName] ?? ''
  const originalLanguage = school.content_language
  const isInSiteLanguage = !originalLanguage || originalLanguage === siteLanguageCode
  if (!originalText || isInSiteLanguage) return { text: originalText, writtenIn: null }

  const translation = school[`${fieldName}${TRANSLATION_SUFFIX}`]
  if (translation) return { text: translation, writtenIn: null }
  return { text: originalText, writtenIn: originalLanguage }
}
