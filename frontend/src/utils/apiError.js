import i18next from 'i18next'

const FIELD_LABEL_PREFIX = 'workspace:content.'

function isFieldErrorsBody(responseBody) {
  return typeof responseBody === 'object' && responseBody !== null && !Array.isArray(responseBody)
}

// Une entrée refusée par un sérialiseur arrive sous la forme
// {champ: [messages]}. Les messages du serveur sont en anglais : je ne garde
// que le nom des champs, pour les nommer dans la langue affichée.
function listRefusedFieldLabels(responseBody) {
  if (!isFieldErrorsBody(responseBody)) return []
  return Object.keys(responseBody)
    .filter((fieldName) => i18next.exists(`${FIELD_LABEL_PREFIX}${fieldName}`))
    .map((fieldName) => i18next.t(`${FIELD_LABEL_PREFIX}${fieldName}`))
}

// L'API renvoie soit une phrase dans « detail », soit une liste d'erreurs de
// validation, soit les champs refusés : je ramène les trois à un message
// affichable.
export function readApiErrorMessage(error) {
  const responseBody = error?.response?.data
  const detail = responseBody?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((validationError) => validationError.msg).join(' ')
  const refusedFieldLabels = listRefusedFieldLabels(responseBody)
  if (refusedFieldLabels.length > 0) {
    return i18next.t('workspace:invalidFields', { fields: refusedFieldLabels.join(', ') })
  }
  return i18next.t('workspace:genericError')
}
