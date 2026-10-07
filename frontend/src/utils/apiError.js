const FALLBACK_MESSAGE = 'Something went wrong. Check what you entered, then try again.'

// L'API renvoie soit une phrase dans « detail », soit une liste d'erreurs de
// validation : je ramène les deux à un message affichable.
export function readApiErrorMessage(error) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((validationError) => validationError.msg).join(' ')
  return FALLBACK_MESSAGE
}
