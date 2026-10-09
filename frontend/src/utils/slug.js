const DIACRITICS = /[̀-ͯ]/g
const NON_ALPHANUMERIC_RUNS = /[^a-z0-9]+/g
const EDGE_HYPHENS = /^-+|-+$/g

// « Collège Moderne de Yaoundé » devient « college-moderne-de-yaounde » :
// minuscules, sans accents, des tirets à la place de tout le reste.
export function toSlug(text) {
  return text
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_RUNS, '-')
    .replace(EDGE_HYPHENS, '')
}
