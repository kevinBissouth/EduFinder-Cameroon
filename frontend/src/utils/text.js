const DIACRITICS = /[\u0300-\u036f]/g

// Forme de comparaison d'un texte : sans accents ni majuscules, pour que
// « yaounde » trouve « Yaoundé ».
export function normalizeForSearch(text) {
  return (text ?? '').normalize('NFD').replace(DIACRITICS, '').toLowerCase().trim()
}
