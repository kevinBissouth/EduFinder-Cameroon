import { formatFcfa, formatPercent } from '../../utils/format'

const TEXT_FIELD_LABELS = {
  phone: 'Phone',
  contact_email: 'Email',
  website: 'Website',
  address: 'Address',
  latitude: 'Latitude',
  longitude: 'Longitude',
  description: 'Description',
  director_name: 'Head of school',
  director_title: 'Head of school title',
  director_bio: 'Head of school biography',
  note: 'Note to the reviewer',
}

// Champs qui portent l'identifiant d'une valeur de référence : j'affiche son
// nom, jamais l'identifiant.
const REFERENCE_FIELDS = {
  id_city: { label: 'City', metaKey: 'cities' },
  id_type: { label: 'School type', metaKey: 'types' },
  id_sector: { label: 'Sector', metaKey: 'sectors' },
  id_linguistic_section: { label: 'Language section', metaKey: 'languages' },
}

const PHOTO_FIELD_LABELS = { cover_photo: 'Cover photo', director_photo: 'Head of school photo' }

const FILE_LIST_LABELS = {
  videos: 'Videos',
  media_additions: 'Gallery files added',
  media_removals: 'Gallery files removed',
}

const UNKNOWN_REFERENCE = 'Unknown'
// Le nom figure déjà dans le titre de la soumission.
const HIDDEN_KEYS = new Set(['name'])

function findReferenceName(references = [], referenceId) {
  return references.find((reference) => reference.id === referenceId)?.name ?? UNKNOWN_REFERENCE
}

function countFiles(files) {
  return files.length === 1 ? '1 file' : `${files.length} files`
}

function describeFee(fee, meta) {
  return `${findReferenceName(meta.levels, fee.id_level)}, ${fee.school_year}: ${formatFcfa(fee.amount)}`
}

function describeExamResult(examResult, meta) {
  return `${findReferenceName(meta.exams, examResult.id_exam)}, ${examResult.session}: ${formatPercent(examResult.pass_rate)}`
}

const LIST_DESCRIBERS = {
  services: (serviceNames) => ({ label: 'Services', items: serviceNames }),
  program_ids: (programIds, meta) => ({
    label: 'Programmes',
    items: programIds.map((programId) => findReferenceName(meta.programs, programId)),
  }),
  fees: (fees, meta) => ({ label: 'Fees', items: fees.map((fee) => describeFee(fee, meta)) }),
  exam_results: (examResults, meta) => ({
    label: 'Exam results',
    items: examResults.map((examResult) => describeExamResult(examResult, meta)),
  }),
}

function toSentenceCase(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function isEmptyValue(value) {
  return value === null || value === '' || (Array.isArray(value) && value.length === 0)
}

function describeEntry(key, value, meta) {
  if (key in REFERENCE_FIELDS) {
    const referenceField = REFERENCE_FIELDS[key]
    return { label: referenceField.label, text: findReferenceName(meta[referenceField.metaKey], value) }
  }
  if (key in PHOTO_FIELD_LABELS) return { label: PHOTO_FIELD_LABELS[key], text: 'New photo attached' }
  if (key in FILE_LIST_LABELS) return { label: FILE_LIST_LABELS[key], text: countFiles(value) }
  if (key in LIST_DESCRIBERS) return LIST_DESCRIBERS[key](value, meta)
  // Une clé que je ne connais pas reste affichée : rien de ce qui a été soumis
  // ne doit disparaître de l'écran.
  const label = TEXT_FIELD_LABELS[key] ?? toSentenceCase(key.replaceAll('_', ' '))
  return { label, text: typeof value === 'object' ? JSON.stringify(value) : String(value) }
}

// Transforme le contenu brut d'une soumission en lignes lisibles : chaque
// ligne a un libellé et soit un texte, soit une liste d'éléments.
export function describeSubmissionContent(content, meta) {
  return Object.entries(content ?? {})
    .filter(([key, value]) => !HIDDEN_KEYS.has(key) && !isEmptyValue(value))
    .map(([key, value]) => ({ key, ...describeEntry(key, value, meta) }))
}
