// Utilitaires partagés par les sections de la fiche d'établissement.
import i18next from 'i18next'


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
    const subject = i18next.t('profile:contact.enquirySubject', { name })
    return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}`
  }
  return phone ? `tel:${phone}` : null
}

const CAMEROON_DIALLING_CODE = '237'
const LOCAL_NUMBER_LENGTH = 9
const WHATSAPP_BASE_URL = 'https://wa.me/'

// WhatsApp attend le numéro en chiffres, indicatif compris. Un numéro saisi
// sans indicatif (neuf chiffres) est camerounais ; trop court, il n'est pas
// exploitable et aucun lien n'est proposé.
export function toWhatsAppUrl(phone) {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (digits.length < LOCAL_NUMBER_LENGTH) return null
  const internationalNumber =
    digits.length === LOCAL_NUMBER_LENGTH ? `${CAMEROON_DIALLING_CODE}${digits}` : digits
  return `${WHATSAPP_BASE_URL}${internationalNumber}`
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
