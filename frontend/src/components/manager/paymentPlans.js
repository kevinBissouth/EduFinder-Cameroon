const ANGLOPHONE_MARKER = 'angl'
const ANGLOPHONE_PLAN_WORD = 'installment'
const FRANCOPHONE_PLAN_WORD = 'tranche'

// Les modalités proposées suivent la langue de l'établissement :
// « installments » pour un anglophone, « tranches » pour un francophone ou un
// bilingue. Si aucune ne correspond, je les propose toutes.
export function listPaymentMethodsForLanguage(linguisticSection, paymentMethods) {
  const isAnglophone = linguisticSection.toLowerCase().includes(ANGLOPHONE_MARKER)
  const planWord = isAnglophone ? ANGLOPHONE_PLAN_WORD : FRANCOPHONE_PLAN_WORD
  const matchingMethods = paymentMethods.filter((paymentMethod) =>
    paymentMethod.toLowerCase().includes(planWord),
  )
  return matchingMethods.length > 0 ? matchingMethods : paymentMethods
}
