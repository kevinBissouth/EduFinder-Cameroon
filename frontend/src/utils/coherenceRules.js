// Ce qu'un établissement peut publier selon son type et sa section
// linguistique : pas de 4e dans une école primaire, pas de CM1 dans une école
// anglophone, pas de CAP dans un lycée général. Les règles viennent du serveur
// (coherence_rules de /filters-meta), qui les applique aussi de son côté.
//
// Dans le doute je ne cache rien : sans type ou sans section choisis, ou pour
// un libellé absent des règles, le choix reste proposé.

function isTypeAllowed(allowedTypes, typeName) {
  return !typeName || !allowedTypes || allowedTypes.includes(typeName)
}

function isFamilyAllowed(languageFamily, allowedFamilies) {
  return !languageFamily || !allowedFamilies || allowedFamilies.includes(languageFamily)
}

function createSchoolFilter(rules, school, ruleNames) {
  const allowedTypesByLabel = rules[ruleNames.allowedTypes] ?? {}
  const familiesByLabel = rules[ruleNames.families] ?? {}
  const allowedFamilies = rules.section_families?.[school.sectionName]
  return (label) =>
    isTypeAllowed(allowedTypesByLabel[label], school.typeName) &&
    isFamilyAllowed(familiesByLabel[label], allowedFamilies)
}

const EXAM_RULE_NAMES = { allowedTypes: 'exam_allowed_types', families: 'exam_families' }
const STAGE_RULE_NAMES = { allowedTypes: 'stage_allowed_types', families: 'stage_families' }

// school = { typeName, sectionName } : les clés métier, pas les libellés traduits.
export function listExamsForSchool(exams = [], rules = {}, school = {}) {
  const isExamOffered = createSchoolFilter(rules, school, EXAM_RULE_NAMES)
  return exams.filter((exam) => isExamOffered(exam.name))
}

// La règle porte sur le cycle de la classe (« Collège », « Primary »…).
export function listLevelsForSchool(levels = [], rules = {}, school = {}) {
  const isStageOffered = createSchoolFilter(rules, school, STAGE_RULE_NAMES)
  return levels.filter((level) => isStageOffered(level.stage))
}
