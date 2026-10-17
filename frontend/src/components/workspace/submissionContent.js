import i18next from 'i18next'

import { formatFcfa, formatPercent } from '../../utils/format'
import { labelLevelOptions } from '../../utils/levelLabels'

// Champs qui portent l'identifiant d'une valeur de référence : j'affiche son
// nom dans la langue affichée, jamais l'identifiant. Les villes sont des noms
// propres, elles ne se traduisent pas.
const REFERENCE_FIELDS = {
  id_city: { metaKey: 'cities' },
  id_type: { metaKey: 'types', referenceKind: 'types' },
  id_sector: { metaKey: 'sectors', referenceKind: 'sectors' },
  id_linguistic_section: { metaKey: 'languages', referenceKind: 'sections' },
}

// Champs dont la valeur est la clé d'une liste de référence : j'affiche son
// libellé dans la langue du site. Une valeur hors liste s'affiche telle quelle.
const REFERENCE_KEY_FIELDS = { director_title: 'head_titles' }

const PHOTO_FIELDS = new Set(['cover_photo', 'director_photo'])
const FILE_LIST_FIELDS = new Set(['videos', 'media_additions', 'media_removals'])

const MEDIA_ADDITIONS_KEY = 'media_additions'
const VIDEOS_KEY = 'videos'
const CONTENT_LANGUAGE_KEY = 'content_language'
const IMAGE_MEDIA_TYPE = 'image'
const VIDEO_MEDIA_TYPE = 'video'

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

// Nom de chaque classe citée par des frais : son nom officiel seul, avec le
// cycle traduit seulement si deux classes de la soumission portent le même nom
// (même règle que le formulaire).
function nameLevelsOf(fees, meta, translateReference) {
  const levelIds = new Set(fees.map((fee) => fee.id_level))
  const levels = (meta.levels ?? []).filter((level) => levelIds.has(level.id))
  const translateStage = (stage) => translateReference('stages', stage)
  return new Map(labelLevelOptions(levels, translateStage).map((level) => [level.id, level.name]))
}

// Les lignes se rangent par groupe (année scolaire, session), dans l'ordre
// où elles ont été saisies.
function groupRows(entries, findGroupTitle, buildRow) {
  const rowsByTitle = new Map()
  entries.forEach((entry) => {
    const title = findGroupTitle(entry)
    rowsByTitle.set(title, [...(rowsByTitle.get(title) ?? []), buildRow(entry)])
  })
  return [...rowsByTitle].map(([title, rows]) => ({ title, rows }))
}

function describeFeeTable(fees, meta, translateReference) {
  const levelNames = nameLevelsOf(fees, meta, translateReference)
  return {
    columns: [translate('levelColumn'), translate('amountColumn')],
    groups: groupRows(
      fees,
      (fee) => translate('schoolYear', { year: fee.school_year }),
      (fee) => ({
        key: `${fee.id_level}-${fee.school_year}`,
        label: levelNames.get(fee.id_level) ?? translate('unknown'),
        detail: (fee.payment_methods ?? [])
          .map((paymentMethod) => translateReference('payment_methods', paymentMethod))
          .join(', '),
        value: formatFcfa(fee.amount),
      }),
    ),
  }
}

function describeExamResultTable(examResults, meta, translateReference) {
  return {
    columns: [translate('examColumn'), translate('passRateColumn')],
    groups: groupRows(
      examResults,
      (examResult) => translate('session', { session: examResult.session }),
      (examResult) => ({
        key: `${examResult.id_exam}-${examResult.session}`,
        label: describeReference(meta.exams, examResult.id_exam, 'exams', translateReference),
        value: formatPercent(examResult.pass_rate),
      }),
    ),
  }
}

// Frais et résultats se lisent en tableau : une classe ou un examen par ligne,
// le montant ou le taux aligné en face.
const TABLE_DESCRIBERS = {
  fees: describeFeeTable,
  exam_results: describeExamResultTable,
}

// Une demande de retrait désigne sa ligne comme le tableau la nomme : sa
// classe et son année, ou son examen et sa session.
function describeFeeRemovals(feeRemovals, meta, translateReference) {
  const levelNames = nameLevelsOf(feeRemovals, meta, translateReference)
  return feeRemovals.map(
    (fee) => `${levelNames.get(fee.id_level) ?? translate('unknown')}, ${fee.school_year}`,
  )
}

function describeExamResultRemovals(examResultRemovals, meta, translateReference) {
  return examResultRemovals.map((examResult) => {
    const examName = describeReference(meta.exams, examResult.id_exam, 'exams', translateReference)
    return `${examName}, ${examResult.session}`
  })
}

const LIST_DESCRIBERS = {
  services: (serviceNames) => serviceNames,
  program_ids: (programIds, meta, translateReference) =>
    programIds.map((programId) =>
      describeReference(meta.programs, programId, 'programs', translateReference),
    ),
  fee_removals: describeFeeRemovals,
  exam_result_removals: describeExamResultRemovals,
}

function toSentenceCase(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function isEmptyValue(value) {
  return value === null || value === '' || (Array.isArray(value) && value.length === 0)
}

function listAddedMediaUrls(key, value, mediaType) {
  if (key !== MEDIA_ADDITIONS_KEY) return []
  return value.filter((mediaItem) => mediaItem.type === mediaType).map((mediaItem) => mediaItem.url)
}

// Images et vidéos qu'une entrée apporte, pour qu'on voie ce qui est proposé
// au lieu d'un simple nombre de fichiers. Une création envoie ses vidéos en
// liste d'adresses ; un ajout à la galerie, en médias typés.
function listImageUrls(key, value) {
  if (PHOTO_FIELDS.has(key)) return [value]
  return listAddedMediaUrls(key, value, IMAGE_MEDIA_TYPE)
}

function listVideoUrls(key, value) {
  if (key === VIDEOS_KEY) return value
  return listAddedMediaUrls(key, value, VIDEO_MEDIA_TYPE)
}

function describeEntry(key, value, meta, translateReference) {
  if (key in REFERENCE_FIELDS) {
    const { metaKey, referenceKind } = REFERENCE_FIELDS[key]
    return {
      label: translate(key),
      text: describeReference(meta[metaKey], value, referenceKind, translateReference),
    }
  }
  if (key === CONTENT_LANGUAGE_KEY) {
    return {
      label: translate(key),
      text: i18next.t(`workspace:languageNames.${value}`, { defaultValue: value }),
    }
  }
  if (key in REFERENCE_KEY_FIELDS) {
    return { label: translate(key), text: translateReference(REFERENCE_KEY_FIELDS[key], value) }
  }
  if (PHOTO_FIELDS.has(key)) return { label: translate(key), text: translate('newPhoto') }
  if (FILE_LIST_FIELDS.has(key)) {
    return { label: translate(key), text: translate('fileCount', { count: value.length }) }
  }
  if (key in TABLE_DESCRIBERS) {
    return { label: translate(key), table: TABLE_DESCRIBERS[key](value, meta, translateReference) }
  }
  if (key in LIST_DESCRIBERS) {
    return { label: translate(key), items: LIST_DESCRIBERS[key](value, meta, translateReference) }
  }
  // Une clé que je ne connais pas reste affichée : rien de ce qui a été soumis
  // ne doit disparaître de l'écran.
  return { label: translateLabel(key), text: typeof value === 'object' ? JSON.stringify(value) : String(value) }
}

// Transforme le contenu brut d'une soumission en lignes lisibles : chaque
// ligne a un libellé et soit un texte, soit une liste d'éléments, soit un
// tableau rangé par groupes.
export function describeSubmissionContent(content, meta, translateReference) {
  return Object.entries(content ?? {})
    .filter(([key, value]) => !HIDDEN_KEYS.has(key) && !isEmptyValue(value))
    .map(([key, value]) => ({
      key,
      imageUrls: listImageUrls(key, value),
      videoUrls: listVideoUrls(key, value),
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
