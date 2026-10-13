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

export function buildInitialFields(school) {
  const detail = school?.detail
  return {
    name: school?.name ?? '',
    phone: '',
    id_city: '',
    id_type: '',
    id_sector: '',
    id_linguistic_section: '',
    contact_email: detail?.contact_email ?? '',
    website: detail?.website ?? '',
    address: detail?.address ?? '',
    description: detail?.description ?? '',
    director_name: detail?.director_name ?? '',
    director_title: detail?.director_title ?? '',
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
export function findProgramIds(programNames, programs) {
  return programNames
    .map((programName) => programs.find((program) => program.name === programName)?.id)
    .filter((programId) => programId !== undefined)
}

export function replaceRow(rows, rowId, changes) {
  return rows.map((row) => (row.rowId === rowId ? { ...row, ...changes } : row))
}

export function removeRow(rows, rowId) {
  return rows.filter((row) => row.rowId !== rowId)
}

function buildFieldsContent(fields) {
  const filledEntries = Object.entries(fields).filter(([, fieldValue]) => fieldValue !== '')
  return Object.fromEntries(
    filledEntries.map(([fieldName, fieldValue]) => [
      fieldName,
      fieldName.startsWith(REFERENCE_FIELD_PREFIX) ? Number(fieldValue) : fieldValue,
    ]),
  )
}

// Les frais des années ouvertes, une ligne par classe. Les années passées ne
// se modifient pas ici ; en modification je n'envoie que ce qui diffère de la
// fiche publiée, une ligne identique n'ayant rien à faire valider.
function listFeesToSend(draft, schoolRecord) {
  const openFeeGroups = draft.feeGroups.filter((feeGroup) =>
    schoolRecord.openSchoolYears.includes(feeGroup.school_year),
  )
  return listChangedFees(expandFeeGroups(openFeeGroups), schoolRecord.publishedFees)
}

// Une ligne incomplète n'est pas envoyée : elle serait refusée par l'API.
function listCompleteExamResults(examResultRows) {
  return examResultRows
    .filter((row) => row.id_exam && row.session.trim() && row.pass_rate !== '')
    .map((row) => ({
      id_exam: Number(row.id_exam),
      session: row.session.trim(),
      pass_rate: Number(row.pass_rate),
    }))
}

// En création, une liste vide n'a rien à dire : je ne l'envoie pas. En
// modification, je n'envoie que les listes que le responsable a touchées :
// une liste absente laisse la fiche telle quelle, alors qu'une liste de
// services ou de programmes envoyée vide les retire tous. Les frais font
// exception : ils partent dès qu'une ligne diffère de la fiche.
// schoolRecord = { publishedFees, openSchoolYears }.
export function buildProposalContent(draft, isCreation, schoolRecord) {
  const fees = listFeesToSend(draft, schoolRecord)
  const lists = {
    exam_results: listCompleteExamResults(draft.examResultRows),
    services: [...draft.serviceNames].sort(),
    program_ids: draft.programIds,
    videos: draft.videoUrls,
  }
  const sentLists = Object.entries(lists).filter(([listName, list]) =>
    isCreation ? list.length > 0 : draft.touchedLists.includes(listName),
  )
  const photos = { cover_photo: draft.coverPhotoUrl, director_photo: draft.directorPhotoUrl }
  const sentPhotos = Object.entries(photos).filter(([, photoUrl]) => photoUrl)

  return {
    ...buildFieldsContent(draft.fields),
    ...(fees.length > 0 ? { fees } : {}),
    ...Object.fromEntries(sentLists),
    ...Object.fromEntries(sentPhotos),
  }
}
