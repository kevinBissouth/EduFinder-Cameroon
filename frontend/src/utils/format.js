// Formatage partagé entre la liste et la fiche : même présentation partout
// (montant FCFA entier, pourcentage sans zéros superflus après la virgule).
export function formatFcfa(amount) {
  return `${Number(amount).toLocaleString('en-US')} FCFA`
}

export function formatPercent(rate) {
  return `${parseFloat(Number(rate).toFixed(1))}%`
}
