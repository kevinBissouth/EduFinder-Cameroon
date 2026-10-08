import i18next from 'i18next'

import { formatFcfa, formatPercent } from '../../utils/format'

// Champs qui portent l'identifiant d'une valeur de référence : j'affiche son
// nom dans la langue affichée, jamais l'identifiant. Les villes sont des noms
// propres, elles ne se traduisent pas.
const REFERENCE_FIELDS = {
  id_city: { metaKey: 'cities' },
  id_type: { metaKey: 'types', referenceKind: 'types' },
  id_sector: { metaKey: 'sectors', referenceKind: 'sectors' },
  id_linguistic_section: { metaKey: 'languages', referenceKind: 'sections' },
}

const PHOTO_FIELDS = new Set(['cover_photo', 'director_photo'])
const FILE_LIST_FIELDS = new Set(['videos', 'media_additions', 'media_removals'])

const translate = (key, options) => i18next.t(`workspace:content.${key}`, options)

// Le nom figure déjà dans le titre de la soumission.
const HIDDEN_KEYS = new Set(['name'])

function findReferenceName(references = [], referenceId) {
  return references.find((reference) => reference.id === referenceId)?.name
}

// Nom d'une valeur de référence, traduit quand sa liste l'est.
function describeReference(references, referenceId, referenceKind, translateReference) {
  const referenceName = findReferenceName(references, referenceId)
  if (referenceName === undefined) return translate('unknown')
  return referenceKind ? translateReference(referenceKind, referenceName) : referenceName
}

function describeFee(fee, meta) {
  const levelName = findReferenceName(meta.levels, fee.id_level) ?? translate('unknown')
  return `${levelName}, ${fee.school_year}: ${formatFcfa(fee.amount)}`
}

function describeExamResult(examResult, meta, translateReference) {
  const examName = describeReference(meta.exams, examResult.id_exam, 'exams', translateReference)
  return `${examName}, ${examResult.session}: ${formatPercent(examResult.pass_rate)}`
}

const LIST_DESCRIBERS = {
  services: (serviceNames) => serviceNames,
  program_ids: (programIds, meta, translateReference) =>
    programIds.map((programId) =>
      describeReference(meta.programs, programId, 'programs', translateReference),
    ),
  fees: (fees, meta) => fees.map((fee) => describeFee(fee, meta)),
  exam_results: (examResults, meta, translateReference) =>
    examResults.map((examResult) => describeExamResult(examResult, meta, translateReference)),
}

function toSentenceCase(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function isEmptyValue(value) {
  return value === null || value === '' || (Array.isArray(value) && value.length === 0)
}

function describeEntry(key, value, meta, translateReference) {
  if (key in REFERENCE_FIELDS) {
    const { metaKey, referenceKind } = REFERENCE_FIELDS[key]
    return {
      label: translate(key),
      text: describeReference(meta[metaKey], value, referenceKind, translateReference),
    }
  }
  if (PHOTO_FIELDS.has(key)) return { label: translate(key), text: translate('newPhoto') }
  if (FILE_LIST_FIELDS.has(key)) {
    return { label: translate(key), text: translate('fileCount', { count: value.length }) }
  }
  if (key in LIST_DESCRIBERS) {
    return { label: translate(key), items: LIST_DESCRIBERS[key](value, meta, translateReference) }
  }
  // Une clé que je ne connais pas reste affichée : rien de ce qui a été soumis
  // ne doit disparaître de l'écran.
  const label = translate(key, { defaultValue: toSentenceCase(key.replaceAll('_', ' ')) })
  return { label, text: typeof value === 'object' ? JSON.stringify(value) : String(value) }
}

// Transforme le contenu brut d'une soumission en lignes lisibles : chaque
// ligne a un libellé et soit un texte, soit une liste d'éléments.
export function describeSubmissionContent(content, meta, translateReference) {
  return Object.entries(content ?? {})
    .filter(([key, value]) => !HIDDEN_KEYS.has(key) && !isEmptyValue(value))
    .map(([key, value]) => ({ key, ...describeEntry(key, value, meta, translateReference) }))
}
