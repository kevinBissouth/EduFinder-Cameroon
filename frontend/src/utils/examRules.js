// Examens à proposer dans le filtre, selon le type d'établissement choisi.
// Sans type choisi, tous sont proposés. Un examen absent de la cartographie
// reste proposé : dans le doute, je ne cache rien.
export function listExamsForType(exams, examAllowedTypes = {}, typeName = null) {
  if (!typeName) return exams
  return exams.filter((exam) => {
    const allowedTypes = examAllowedTypes[exam.name]
    return !allowedTypes || allowedTypes.includes(typeName)
  })
}
