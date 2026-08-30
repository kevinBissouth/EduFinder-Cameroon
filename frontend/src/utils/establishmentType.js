// Certaines sections n'ont de sens que pour certains types d'établissement :
// une école primaire ou une maternelle ne propose ni filières ni examens officiels.
export function typeSupportsPrograms(typeLabel) {
  const normalized = (typeLabel || '').toLowerCase()
  return !(
    normalized.includes('primary') ||
    normalized.includes('nursery') ||
    normalized.includes('kindergarten') ||
    normalized.includes('maternelle') ||
    normalized.includes('crèche') ||
    normalized.includes('creche') ||
    normalized.includes('preschool')
  )
}

export function typeSupportsExamResults(typeLabel) {
  const normalized = (typeLabel || '').toLowerCase()
  return !(
    normalized.includes('primary') ||
    normalized.includes('nursery') ||
    normalized.includes('kindergarten') ||
    normalized.includes('maternelle') ||
    normalized.includes('crèche') ||
    normalized.includes('creche') ||
    normalized.includes('preschool')
  )
}
