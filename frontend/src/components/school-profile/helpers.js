// Utilitaires partagés par les sections de la fiche d'établissement.

const URL_SCHEME_PATTERN = /^([a-z][a-z0-9+.-]*):/i
const SAFE_SCHEMES = ['http', 'https']

// Beaucoup de sites sont saisis sans schéma (« www.ecole.cm ») : tel quel, le
// navigateur en ferait un lien relatif cassé. Tout schéma autre que http(s)
// est refusé, pour qu'une adresse comme « javascript: » ne devienne jamais un
// lien cliquable.
export function toExternalUrl(website) {
  const trimmedWebsite = (website ?? '').trim()
  if (!trimmedWebsite) return null
  const matchedScheme = trimmedWebsite.match(URL_SCHEME_PATTERN)
  if (!matchedScheme) return `https://${trimmedWebsite}`
  return SAFE_SCHEMES.includes(matchedScheme[1].toLowerCase()) ? trimmedWebsite : null
}

// Lien de prise de contact : l'e-mail d'abord (avec un objet prérempli), le
// téléphone à défaut.
export function buildContactHref({ name, contact_email: contactEmail, phone }) {
  if (contactEmail) {
    return `mailto:${contactEmail}?subject=${encodeURIComponent(`Admission enquiry: ${name}`)}`
  }
  return phone ? `tel:${phone}` : null
}

// Années scolaires de la plus récente à la plus ancienne, chacune avec ses frais.
export function groupFeesByYear(fees) {
  const feesBySchoolYear = new Map()
  fees.forEach((fee) => {
    feesBySchoolYear.set(fee.school_year, [...(feesBySchoolYear.get(fee.school_year) ?? []), fee])
  })
  return [...feesBySchoolYear.entries()].sort(([firstYear], [secondYear]) =>
    secondYear.localeCompare(firstYear),
  )
}

// Dernier résultat publié de chaque examen (session la plus récente).
export function listLatestExamResults(examResults) {
  const latestResultByExam = new Map()
  examResults.forEach((examResult) => {
    const knownResult = latestResultByExam.get(examResult.exam)
    if (!knownResult || Number(examResult.session) > Number(knownResult.session)) {
      latestResultByExam.set(examResult.exam, examResult)
    }
  })
  return [...latestResultByExam.values()].sort(
    (firstResult, secondResult) => Number(secondResult.pass_rate) - Number(firstResult.pass_rate),
  )
}
