// Résultats d'examens saisis session par session : la session se choisit une
// fois, et une nouvelle session s'ouvre avec une ligne par examen, il ne reste
// qu'à taper les taux. Le brouillon garde une seule liste de lignes, chacune
// avec sa session : ce fichier en tire ce que l'écran d'une session affiche.
import { createExamResultRow } from './proposalDraft.js'

// Assez d'années pour qu'une nouvelle fiche publie son historique récent,
// sans dérouler une liste interminable. Une session plus ancienne déjà saisie
// reste proposée.
export const EXAM_SESSION_YEARS_OFFERED = 10

function sortNewestFirst(sessions) {
  return [...new Set(sessions)].sort((first, second) => second.localeCompare(first))
}

function listEnteredSessions(examResultRows) {
  return examResultRows.map((examResultRow) => examResultRow.session).filter(Boolean)
}

// La plus récente d'abord. latestSession vient du serveur : aucune session à
// venir n'est proposée, puisqu'il la refuserait.
export function listSessionChoices(examResultRows, latestSession) {
  const recentSessions = latestSession
    ? Array.from({ length: EXAM_SESSION_YEARS_OFFERED }, (_, yearsBack) =>
        String(Number(latestSession) - yearsBack),
      )
    : []
  return sortNewestFirst([...recentSessions, ...listEnteredSessions(examResultRows)])
}

export function findLatestEnteredSession(examResultRows) {
  return sortNewestFirst(listEnteredSessions(examResultRows))[0] ?? null
}

// Les examens de la session saisie la plus récente, s'ils conviennent encore
// à l'établissement ; sans historique, tous ceux qu'il peut présenter. Dans
// l'ordre de la liste des examens, pour retrouver le même ordre d'une session
// à l'autre.
export function findExamIdsToPrefill(examResultRows, exams, offeredExamIds) {
  const latestSession = findLatestEnteredSession(examResultRows)
  const previousExamIds = new Set(
    examResultRows
      .filter((examResultRow) => examResultRow.session === latestSession)
      .map((examResultRow) => examResultRow.id_exam),
  )
  const offeredExamIdsInOrder = exams
    .map((exam) => String(exam.id))
    .filter((examId) => offeredExamIds.has(examId))
  const previousExamIdsInOrder = offeredExamIdsInOrder.filter((examId) =>
    previousExamIds.has(examId),
  )
  return previousExamIdsInOrder.length > 0 ? previousExamIdsInOrder : offeredExamIdsInOrder
}

export function createSessionRows(examIds, session) {
  return examIds.map((examId) => ({ ...createExamResultRow(), id_exam: examId, session }))
}

// Un examen n'a qu'un taux par session : celui d'une autre ligne de la même
// session n'est plus proposé.
export function listTakenExamIds(examResultRows, editedRow) {
  return examResultRows
    .filter(
      (examResultRow) =>
        examResultRow.rowId !== editedRow.rowId && examResultRow.session === editedRow.session,
    )
    .map((examResultRow) => examResultRow.id_exam)
    .filter(Boolean)
}

// Une seule session est affichée à la fois : celles qui gardent une erreur
// doivent être signalées, sinon l'étape resterait bloquée sans raison visible.
export function listSessionsWithErrors(examResultRows, hasRowError) {
  return sortNewestFirst(
    examResultRows.filter(hasRowError).map((examResultRow) => examResultRow.session),
  )
}
