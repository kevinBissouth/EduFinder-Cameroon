// Même seuil que l'API : en dessous, le motif serait refusé (422).
const MINIMUM_REASON_LENGTH = 3

export function isReasonValid(reason) {
  return reason.trim().length >= MINIMUM_REASON_LENGTH
}
