// Quand le type ou la section de l'établissement change en cours de saisie,
// ce qui a été rempli plus loin peut ne plus avoir de sens : des frais de CM1
// pour ce qui est devenu un lycée, un CEP, des filières. Je retire alors ce
// qui ne correspond plus, plutôt que de laisser le responsable buter sur une
// erreur trois étapes plus loin.
//
// allowed = { levelIds, examIds, supportsPrograms } : ce que le nouveau choix
// permet, classes et examens déjà publiés sur la fiche compris (ils restent
// modifiables).

function keepAllowedLevels(feeGroup, allowedLevelIds) {
  return {
    ...feeGroup,
    levelIds: feeGroup.levelIds.filter((levelId) => allowedLevelIds.has(levelId)),
  }
}

// Un montant qui perd toutes ses classes n'a plus d'objet : il part avec
// elles. Un montant qui n'en avait pas encore reste, il est en cours de saisie.
function cleanFeeGroups(feeGroups, allowedLevelIds) {
  return feeGroups
    .map((feeGroup) => ({
      hadLevels: feeGroup.levelIds.length > 0,
      cleanedGroup: keepAllowedLevels(feeGroup, allowedLevelIds),
    }))
    .filter(({ hadLevels, cleanedGroup }) => !hadLevels || cleanedGroup.levelIds.length > 0)
    .map(({ cleanedGroup }) => cleanedGroup)
}

// Une ligne de résultat sans examen choisi reste : elle est en cours de saisie.
function cleanExamResultRows(examResultRows, allowedExamIds) {
  return examResultRows.filter(
    (examResultRow) => !examResultRow.id_exam || allowedExamIds.has(examResultRow.id_exam),
  )
}

function countLevels(feeGroups) {
  return feeGroups.reduce((levelCount, feeGroup) => levelCount + feeGroup.levelIds.length, 0)
}

// Renvoie le brouillon nettoyé et ce qui a été retiré, pour pouvoir le dire.
export function cleanDraftForSchoolProfile(draft, allowed) {
  const feeGroups = cleanFeeGroups(draft.feeGroups, allowed.levelIds)
  const examResultRows = cleanExamResultRows(draft.examResultRows, allowed.examIds)
  const programIds = allowed.supportsPrograms ? draft.programIds : []
  const removed = {
    levels: countLevels(draft.feeGroups) - countLevels(feeGroups),
    examResults: draft.examResultRows.length - examResultRows.length,
    programs: draft.programIds.length - programIds.length,
  }

  return {
    draft: { ...draft, feeGroups, examResultRows, programIds },
    hasRemovedSomething: Object.values(removed).some((removedCount) => removedCount > 0),
  }
}
