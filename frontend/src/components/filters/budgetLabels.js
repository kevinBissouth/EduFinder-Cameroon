import { formatFcfa } from '../../utils/format'

// Fourchette de budget dite en clair, pour le bouton du filtre comme pour les
// raccourcis de sa fenêtre : une seule formulation, à un seul endroit. Les
// clés portent leur espace (« home: ») : ce fichier n'appelle pas useTranslation.
export function describeBudget(minimumFee, maximumFee, t) {
  if (minimumFee && maximumFee) {
    return t('home:filters.budgetRange', { minimum: formatFcfa(minimumFee), maximum: formatFcfa(maximumFee) })
  }
  if (minimumFee) return t('home:filters.budgetFrom', { minimum: formatFcfa(minimumFee) })
  if (maximumFee) return t('home:filters.budgetUpTo', { maximum: formatFcfa(maximumFee) })
  return t('home:filters.any')
}
