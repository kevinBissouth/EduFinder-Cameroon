// Brouillon d'une proposition : ce que le formulaire fait saisir, et sa
// traduction en contenu envoyé à l'API.

import { expandFeeGroups, listChangedFees } from './feeGroups.js'
import { createUniqueId } from '../../../utils/uniqueId.js'

const REFERENCE_FIELD_PREFIX = 'id_'
export const REQUIRED_CLASSIFICATION_FIELDS = [
  'id_city',
  'id_type',
  'id_sector',
  'id_linguistic_section',
]

// Un choix de référence se garde en texte dans le formulaire, comme la valeur
// d'une tuile de choix.
function toChoiceValue(referenceId) {
  return referenceId == null ? '' : String(referenceId)
}

// headTitlesByType vient des règles du serveur : une fiche sans titre part
// avec celui de son type (« Proviseur » pour un lycée).
export function buildInitialFields(school, headTitlesByType = {}) {
  const detail = school?.detail
  return {
    name: school?.name ?? '',
    phone: detail?.phone ?? '',
    id_city: toChoiceValue(detail?.id_city),
    id_type: toChoiceValue(detail?.id_type),
    id_sector: toChoiceValue(detail?.id_sector),
    id_linguistic_section: toChoiceValue(detail?.id_linguistic_section),
    contact_email: detail?.contact_email ?? '',
    website: detail?.website ?? '',
    address: detail?.address ?? '',
    description: detail?.description ?? '',
    director_name: detail?.director_name ?? '',
    director_title: detail?.director_title || headTitlesByType[detail?.type]?.[0] || '',
    director_bio: detail?.director_bio ?? '',
    content_language: detail?.content_language ?? '',
    description_translation: detail?.description_translation ?? '',
    director_title_translation: detail?.director_title_translation ?? '',
    director_bio_translation: detail?.director_bio_translation ?? '',
  }
}

export function createExamResultRow(examResult) {
  return {
    rowId: createUniqueId(),
    id_exam: examResult ? String(examResult.id_exam) : '',
    session: examResult?.session ?? '',
    pass_rate: examResult ? String(Number(examResult.pass_rate)) : '',
  }
}

// La fiche donne les programmes par nom, l'API les attend par identifiant.
function findProgramIds(programNames, programs) {
  return programNames
    .map((programName) => programs.find((program) => program.name === programName)?.id)
    .filter((programId) => programId !== undefined)
}

// La fiche publiée, dans la forme du brouillon : l'assistant part d'elle, et
// une proposition n'envoie que ce qui en diffère. Sans fiche (création), tout
// est vide : tout ce qui est rempli part. Le titre suggéré d'après le type
// n'en fait pas partie, il n'est pas publié.
export function buildPublishedRecord(school, programs = []) {
  const detail = school?.detail
  return {
    fields: buildInitialFields(school),
    fees: detail?.fees ?? [],
    examResults: detail?.exam_results ?? [],
    serviceNames: (detail?.services ?? []).map((service) => service.name),
    programIds: findProgramIds(detail?.programs ?? [], programs),
  }
}

export function replaceRow(rows, rowId, changes) {
  return rows.map((row) => (row.rowId === rowId ? { ...row, ...changes } : row))
}

export function removeRow(rows, rowId) {
  return rows.filter((row) => row.rowId !== rowId)
}

// Un champ vidé n'est pas envoyé : l'API ne sait pas encore effacer un champ.
function buildFieldsContent(fields, publishedFields) {
  const changedEntries = Object.entries(fields).filter(
    ([fieldName, fieldValue]) => fieldValue !== '' && fieldValue !== publishedFields[fieldName],
  )
  return Object.fromEntries(
    changedEntries.map(([fieldName, fieldValue]) => [
      fieldName,
      fieldName.startsWith(REFERENCE_FIELD_PREFIX) ? Number(fieldValue) : fieldValue,
    ]),
  )
}

// Les frais des années ouvertes, une ligne par classe. Les années passées ne
// se modifient pas ici.
function listFeesToSend(draft, schoolRecord) {
  const openFeeGroups = draft.feeGroups.filter((feeGroup) =>
    schoolRecord.openSchoolYears.includes(feeGroup.school_year),
  )
  return listChangedFees(expandFeeGroups(openFeeGroups), schoolRecord.fees)
}

function describeExamResult(examResult) {
  return `${examResult.id_exam}|${examResult.session}|${Number(examResult.pass_rate)}`
}

// Une ligne incomplète n'est pas envoyée : elle serait refusée par l'API. Le
// serveur applique les résultats un par un, ceux qui n'ont pas changé n'ont
// donc pas à repartir.
function listExamResultsToSend(examResultRows, publishedExamResults) {
  const publishedResults = new Set(publishedExamResults.map(describeExamResult))
  return examResultRows
    .filter((row) => row.id_exam && row.session.trim() && row.pass_rate !== '')
    .map((row) => ({
      id_exam: Number(row.id_exam),
      session: row.session.trim(),
      pass_rate: Number(row.pass_rate),
    }))
    .filter((examResult) => !publishedResults.has(describeExamResult(examResult)))
}

// L'ordre d'une liste de services ou de filières ne compte pas.
function haveSameMembers(firstList, secondList) {
  const sortedFirst = [...firstList].map(String).sort()
  const sortedSecond = [...secondList].map(String).sort()
  return sortedFirst.join('|') === sortedSecond.join('|')
}

// Les services et les filières remplacent ceux de la fiche : une liste envoyée
// vide les retire tous, une liste absente les laisse tels quels.
function listReplacedLists(draft, schoolRecord) {
  const replacedLists = [
    ['services', [...draft.serviceNames].sort(), schoolRecord.serviceNames],
    ['program_ids', draft.programIds, schoolRecord.programIds],
  ]
  return replacedLists
    .filter(([, draftList, publishedList]) => !haveSameMembers(draftList, publishedList))
    .map(([listName, draftList]) => [listName, draftList])
}

// Seul ce qui diffère de la fiche publiée part : le super admin ne lit que les
// vrais changements, et une proposition qui attend sa validation ne remet pas
// en place les anciennes valeurs d'une autre qui l'a précédée. Les vidéos et
// les photos ne sont que des ajouts.
// schoolRecord = buildPublishedRecord(…) et les années ouvertes aux frais.
export function buildProposalContent(draft, schoolRecord) {
  const fees = listFeesToSend(draft, schoolRecord)
  const examResults = listExamResultsToSend(draft.examResultRows, schoolRecord.examResults)
  const additions = {
    cover_photo: draft.coverPhotoUrl,
    director_photo: draft.directorPhotoUrl,
    videos: draft.videoUrls.length > 0 ? draft.videoUrls : '',
  }

  return {
    ...buildFieldsContent(draft.fields, schoolRecord.fields),
    ...(fees.length > 0 ? { fees } : {}),
    ...(examResults.length > 0 ? { exam_results: examResults } : {}),
    ...Object.fromEntries(listReplacedLists(draft, schoolRecord)),
    ...Object.fromEntries(Object.entries(additions).filter(([, addition]) => addition)),
  }
}
