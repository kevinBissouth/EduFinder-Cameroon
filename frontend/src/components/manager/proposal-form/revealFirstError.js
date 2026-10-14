// Un champ en erreur porte aria-invalid ; une erreur qui n'a pas de champ à
// l'écran (une autre session d'examens) s'annonce par une alerte.
const FIRST_ERROR_SELECTOR = '[aria-invalid="true"], [role="alert"]'

// Sur téléphone, le bouton « Suivant » est en bas d'une longue étape : sans ce
// défilement, le responsable ne voit pas ce qui l'empêche d'avancer.
export function revealFirstError(container) {
  const firstError = container?.querySelector(FIRST_ERROR_SELECTOR)
  if (!firstError) return
  firstError.scrollIntoView({ block: 'center' })
  firstError.focus({ preventScroll: true })
}
