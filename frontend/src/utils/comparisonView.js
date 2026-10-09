// Ce que la page de comparaison affiche, calculé sans affichage : des
// fonctions pures, qui reçoivent les fiches et rendent des valeurs prêtes à
// poser. Rien n'est inventé (une donnée absente reste absente) et rien n'est
// classé : la page montre, le visiteur juge.
import {
  groupFeesByYear,
  listLatestExamResults,
  toExternalUrl,
} from '../components/school-profile/helpers.js'

const LOCATION_SEPARATOR = ', '
const FULL_SHARE = 100

export const EXAM_STATUS = {
  published: 'published',
  notPublished: 'notPublished',
  notApplicable: 'notApplicable',
}

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

// Photo de couverture d'une fiche : sa première image, ou rien.
export function findCoverUrl(institution) {
  return (institution.media ?? []).find((media) => media.type === 'image')?.url ?? null
}

const PROFILE_FACT_READERS = {
  type: (institution, translateReference) => translateReference('types', institution.type),
  sector: (institution, translateReference) =>
    capitalize(translateReference('sectors', institution.sector)),
  section: (institution, translateReference) =>
    translateReference('sections', institution.linguistic_section),
  location: (institution, translateReference) =>
    [institution.city, translateReference('regions', institution.region)]
      .filter(Boolean)
      .join(LOCATION_SEPARATOR),
}

function isSharedFact(fact) {
  const [firstValue] = fact.values
  return Boolean(firstValue) && fact.values.every((value) => value === firstValue)
}

// Chaque caractéristique, avec sa valeur pour chaque établissement ; celles
// qui sont identiques partout sont aussi listées à part, pour être dites une
// seule fois en tête du thème.
export function buildProfileFacts(institutions, translateReference) {
  const facts = Object.entries(PROFILE_FACT_READERS).map(([id, readFact]) => ({
    id,
    values: institutions.map((institution) => readFact(institution, translateReference) || null),
  }))
  return {
    facts,
    shared: facts.filter(isSharedFact).map((fact) => ({ id: fact.id, value: fact.values[0] })),
  }
}

function readLatestFees(institution) {
  const [latestYearFees] = groupFeesByYear(institution.fees ?? [])
  if (!latestYearFees) return null
  const [schoolYear, fees] = latestYearFees
  const amounts = fees.map((fee) => Number(fee.amount))
  return {
    schoolYear,
    lowestAmount: Math.min(...amounts),
    highestAmount: Math.max(...amounts),
    paymentMethods: [...new Set(fees.flatMap((fee) => fee.payment_methods ?? []))],
    classFees: fees.map((fee) => ({
      className: fee.class,
      stage: fee.stage,
      amount: Number(fee.amount),
    })),
  }
}

// Les deux chiffres qu'un parent regarde d'abord : les frais les plus bas de
// l'année en cours et le meilleur taux de réussite de la dernière session.
// Ce sont les chiffres de l'établissement lui-même, pas un classement.
export function buildKeyFigures(institution) {
  const latestFees = readLatestFees(institution)
  const passRates = listLatestExamResults(institution.exam_results ?? []).map((examResult) =>
    Number(examResult.pass_rate),
  )
  return {
    lowestFee: latestFees ? latestFees.lowestAmount : null,
    bestPassRate: passRates.length > 0 ? Math.max(...passRates) : null,
  }
}

function toShare(amount, largestAmount) {
  return largestAmount > 0 ? Math.round((amount / largestAmount) * FULL_SHARE) : 0
}

// Frais de l'année la plus récente de chaque établissement. Les parts (de 0 à
// 100) donnent la longueur des barres : la plus chère des écoles comparées
// remplit la sienne, les autres s'y mesurent.
export function buildFeeComparison(institutions) {
  const latestFees = institutions.map(readLatestFees)
  const largestAmount = Math.max(0, ...latestFees.filter(Boolean).map((fees) => fees.highestAmount))
  return latestFees.map(
    (fees) =>
      fees && {
        ...fees,
        lowestShare: toShare(fees.lowestAmount, largestAmount),
        highestShare: toShare(fees.highestAmount, largestAmount),
      },
  )
}

// Un examen absent de la cartographie n'est jamais déclaré sans objet : dans
// le doute, il reste « Non communiqué ».
function sitsExam(institution, exam, examAllowedTypes) {
  const allowedTypes = examAllowedTypes[exam]
  return !allowedTypes || allowedTypes.includes(institution.type)
}

function readExamEntry(institution, exam, examAllowedTypes) {
  const examResult = listLatestExamResults(institution.exam_results ?? []).find(
    (result) => result.exam === exam,
  )
  if (examResult) {
    return {
      status: EXAM_STATUS.published,
      passRate: Number(examResult.pass_rate),
      session: examResult.session,
    }
  }
  if (sitsExam(institution, exam, examAllowedTypes)) return { status: EXAM_STATUS.notPublished }
  // Sans cette distinction, une université semblerait cacher son BEPC.
  return { status: EXAM_STATUS.notApplicable }
}

function listComparedExams(institutions) {
  return [
    ...new Set(
      institutions.flatMap((institution) =>
        listLatestExamResults(institution.exam_results ?? []).map((examResult) => examResult.exam),
      ),
    ),
  ]
}

// Un bloc par examen présenté par au moins un des établissements, avec la
// dernière session de chacun.
export function buildExamComparison(institutions, examAllowedTypes = {}) {
  return listComparedExams(institutions).map((exam) => ({
    exam,
    entries: institutions.map((institution) => readExamEntry(institution, exam, examAllowedTypes)),
  }))
}

// Ce que toutes les listes ont en commun. Avec un seul établissement, rien
// n'est « commun » : il n'y a personne avec qui le partager.
export function findSharedItems(itemLists) {
  const [firstList = [], ...otherLists] = itemLists
  if (otherLists.length === 0) return []
  return firstList.filter((item) => otherLists.every((itemList) => itemList.includes(item)))
}

// Un site web au schéma douteux (javascript:…) n'obtient pas de lien.
export function buildContactLinks(institution) {
  return {
    phoneHref: institution.phone ? `tel:${institution.phone}` : null,
    emailHref: institution.contact_email ? `mailto:${institution.contact_email}` : null,
    websiteHref: toExternalUrl(institution.website),
  }
}
