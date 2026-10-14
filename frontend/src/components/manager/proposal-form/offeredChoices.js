import { listExamsForSchool, listLevelsForSchool } from '../../../utils/coherenceRules.js'

// Le choix fait dans le formulaire l'emporte ; à défaut, la valeur actuelle
// de la fiche (en modification, le formulaire part de celle-ci).
function findSelectedName(options = [], selectedId, currentName = '') {
  return options.find((option) => String(option.id) === selectedId)?.name ?? currentName
}

function toIdSet(items, readId) {
  return new Set(items.map((item) => String(readId(item))))
}

// Les classes et les examens que le formulaire propose pour cet
// établissement, d'après son type et sa section linguistique.
export function findOfferedChoices(meta, school, fields) {
  const detail = school?.detail
  const schoolProfile = {
    typeName: findSelectedName(meta.types, fields.id_type, detail?.type),
    sectionName: findSelectedName(
      meta.languages,
      fields.id_linguistic_section,
      detail?.linguistic_section,
    ),
  }
  const offeredLevels = listLevelsForSchool(meta.levels, meta.coherence_rules, schoolProfile)
  const offeredExams = listExamsForSchool(meta.exams, meta.coherence_rules, schoolProfile)

  return {
    typeName: schoolProfile.typeName,
    offeredLevelIds: toIdSet(offeredLevels, (level) => level.id),
    offeredExamIds: toIdSet(offeredExams, (exam) => exam.id),
    // Ce qui est déjà publié sur la fiche reste modifiable même hors règle :
    // le serveur le tolère aussi, la règle étant arrivée après les données.
    publishedLevelIds: toIdSet(detail?.fees ?? [], (fee) => fee.id_level),
    publishedExamIds: toIdSet(detail?.exam_results ?? [], (examResult) => examResult.id_exam),
  }
}

// Une valeur déjà choisie sur une ligne reste dans sa liste, même si elle
// n'est plus proposée : sinon la ligne afficherait un choix vide.
export function listRowOptions(options, offeredIds, selectedId) {
  return options.filter(
    (option) => offeredIds.has(String(option.id)) || String(option.id) === selectedId,
  )
}
