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

const MEDIA_ADDITIONS_KEY = 'media_additions'
const IMAGE_MEDIA_TYPE = 'image'

const translate = (key, options) => i18next.t(`workspace:content.${key}`, options)

function translateLabel(key) {
  return translate(key, { defaultValue: toSentenceCase(key.replaceAll('_', ' ')) })
}

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

// Images qu'une entrée apporte, pour que le validateur voie ce qu'il valide.
function listImageUrls(key, value) {
  if (PHOTO_FIELDS.has(key)) return [value]
  if (key !== MEDIA_ADDITIONS_KEY) return []
  return value.filter((mediaItem) => mediaItem.type === IMAGE_MEDIA_TYPE).map((mediaItem) => mediaItem.url)
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
  return { label: translateLabel(key), text: typeof value === 'object' ? JSON.stringify(value) : String(value) }
}

// Transforme le contenu brut d'une soumission en lignes lisibles : chaque
// ligne a un libellé et soit un texte, soit une liste d'éléments.
export function describeSubmissionContent(content, meta, translateReference) {
  return Object.entries(content ?? {})
    .filter(([key, value]) => !HIDDEN_KEYS.has(key) && !isEmptyValue(value))
    .map(([key, value]) => ({
      key,
      imageUrls: listImageUrls(key, value),
      ...describeEntry(key, value, meta, translateReference),
    }))
}

function listFilledKeys(content) {
  return Object.entries(content ?? {})
    .filter(([, value]) => !isEmptyValue(value))
    .map(([key]) => key)
}

// Les rubriques qu'une soumission touche, pour distinguer deux cartes sans
// les ouvrir. La liste du super administrateur les reçoit toutes prêtes
// (changed_fields) ; celle du responsable les déduit du contenu.
export function listChangedSections(submission) {
  const changedKeys = submission.changed_fields ?? listFilledKeys(submission.content)
  return changedKeys.filter((key) => !HIDDEN_KEYS.has(key)).map(translateLabel)
}
