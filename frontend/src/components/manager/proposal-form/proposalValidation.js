// Contrôles d'une étape du formulaire de proposition. Ils reprennent les
// règles du sérialiseur (backend_django/edufinder/serializers/proposal.py) :
// le serveur reste seul juge, ces contrôles servent à montrer l'erreur sur
// l'étape où elle se trouve plutôt qu'à l'envoi, six étapes plus loin.
import { isBlankFeeGroup } from './feeGroups.js'
import { REQUIRED_CLASSIFICATION_FIELDS } from './proposalDraft.js'

const EXAM_SESSION_PATTERN = /^\d{4}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const WHITESPACE_PATTERN = /\s/
const SPACES_PATTERN = / /g
const CAMEROON_PHONE_PATTERN = /^(\+237)?\d{9}$/
const URL_SCHEME_PATTERN = /^([a-z][a-z0-9+.-]*):/i
const SAFE_WEBSITE_SCHEMES = ['http', 'https']
const MIN_NAME_LENGTH = 2
const MIN_PASS_RATE = 0
const MAX_PASS_RATE = 100

export const FIELD_MAX_LENGTHS = {
  name: 255,
  phone: 20,
  contact_email: 255,
  website: 255,
  address: 255,
  director_name: 120,
}

export function rowErrorPath(listName, rowId, fieldName) {
  return `${listName}.${rowId}.${fieldName}`
}

function checkName(name, isCreation) {
  const trimmedName = name.trim()
  if (!trimmedName) return isCreation ? 'required' : null
  return trimmedName.length < MIN_NAME_LENGTH ? 'nameTooShort' : null
}

function checkPhone(phone) {
  const compactPhone = phone.replace(SPACES_PATTERN, '')
  if (!compactPhone) return null
  return CAMEROON_PHONE_PATTERN.test(compactPhone) ? null : 'invalidPhone'
}

function checkEmail(email) {
  if (!email.trim()) return null
  return EMAIL_PATTERN.test(email.trim()) ? null : 'invalidEmail'
}

// Le site devient un lien cliquable sur la fiche publique : le serveur refuse
// tout schéma autre que http(s), « javascript: » compris.
function checkWebsite(website) {
  if (!website) return null
  if (WHITESPACE_PATTERN.test(website)) return 'invalidWebsite'
  const scheme = website.match(URL_SCHEME_PATTERN)?.[1].toLowerCase()
  return scheme && !SAFE_WEBSITE_SCHEMES.includes(scheme) ? 'invalidWebsite' : null
}

function keepErrors(errorsByPath) {
  return Object.fromEntries(Object.entries(errorsByPath).filter(([, errorKey]) => errorKey))
}

function validateGeneral(draft, { isCreation }) {
  const { fields } = draft
  return keepErrors({
    name: checkName(fields.name, isCreation),
    phone: checkPhone(fields.phone),
    contact_email: checkEmail(fields.contact_email),
    website: checkWebsite(fields.website),
  })
}

// En modification rien n'est obligatoire : seul ce qui est rempli est envoyé.
function validateClassification(draft, { isCreation }) {
  if (!isCreation) return {}
  return keepErrors(
    Object.fromEntries(
      REQUIRED_CLASSIFICATION_FIELDS.map((fieldName) => [
        fieldName,
        draft.fields[fieldName] === '' ? 'required' : null,
      ]),
    ),
  )
}

function checkAmount(amount) {
  if (!amount) return 'required'
  return Number(amount) > 0 ? null : 'amountPositive'
}

function checkSession(session) {
  if (!session.trim()) return 'required'
  return EXAM_SESSION_PATTERN.test(session.trim()) ? null : 'sessionFormat'
}

function checkPassRate(passRate) {
  if (passRate === '') return 'required'
  const rate = Number(passRate)
  return rate >= MIN_PASS_RATE && rate <= MAX_PASS_RATE ? null : 'passRateRange'
}

// Une classe ou un examen hors des choix de l'établissement : cela n'arrive
// que si le type ou la section ont changé après la saisie de la ligne.
function checkChoice(choiceId, allowedIds, notOfferedError) {
  if (!choiceId) return 'required'
  return allowedIds.has(choiceId) ? null : notOfferedError
}

const FEE_GROUPS_LIST_NAME = 'feeGroups'

// Un montant doit avoir au moins une classe, et seulement des classes que
// l'établissement peut proposer (le type ou la section ont pu changer depuis).
function checkGroupLevels(levelIds, allowedLevelIds) {
  if (levelIds.length === 0) return 'classesRequired'
  return levelIds.every((levelId) => allowedLevelIds.has(levelId)) ? null : 'levelNotOffered'
}

function validateFeeGroup(feeGroup, { allowedLevelIds }) {
  return keepErrors({
    [rowErrorPath(FEE_GROUPS_LIST_NAME, feeGroup.groupId, 'amount')]: checkAmount(feeGroup.amount),
    [rowErrorPath(FEE_GROUPS_LIST_NAME, feeGroup.groupId, 'levelIds')]: checkGroupLevels(
      feeGroup.levelIds,
      allowedLevelIds,
    ),
  })
}

// Seules les années ouvertes se saisissent : les montants des années passées
// restent dans le brouillon pour mémoire, sans être contrôlés ni envoyés. Un
// montant ajouté puis laissé vide n'est pas une erreur.
function validateFeeGroups(draft, context) {
  const editedGroups = draft.feeGroups.filter(
    (feeGroup) =>
      context.openSchoolYears.includes(feeGroup.school_year) && !isBlankFeeGroup(feeGroup),
  )
  return Object.assign({}, ...editedGroups.map((feeGroup) => validateFeeGroup(feeGroup, context)))
}

const EXAM_RESULT_ROWS_RULE = {
  listName: 'examResultRows',
  checks: {
    id_exam: (examId, { allowedExamIds }) => checkChoice(examId, allowedExamIds, 'examNotOffered'),
    session: checkSession,
    pass_rate: checkPassRate,
  },
  identify: (examResultRow) => `${examResultRow.id_exam}|${examResultRow.session.trim()}`,
  duplicateField: 'session',
  duplicateError: 'duplicateResult',
}

// Une ligne ajoutée puis laissée vide n'est pas envoyée : ce n'est pas une
// erreur. Une ligne commencée doit être complète.
function isBlankRow(row, rule) {
  return Object.keys(rule.checks).every((fieldName) => String(row[fieldName]).trim() === '')
}

function validateRow(row, rule, context) {
  return keepErrors(
    Object.fromEntries(
      Object.entries(rule.checks).map(([fieldName, check]) => [
        rowErrorPath(rule.listName, row.rowId, fieldName),
        check(row[fieldName], context),
      ]),
    ),
  )
}

// Deux lignes pour la même classe et la même année : le serveur refuserait
// toute la proposition. Je signale la seconde, parmi les lignes déjà
// correctes : une ligne incomplète a d'abord une autre erreur à corriger.
function findDuplicateRows(rows, rule) {
  const seenIdentities = new Set()
  return rows.filter((row) => {
    const identity = rule.identify(row)
    const isDuplicate = seenIdentities.has(identity)
    seenIdentities.add(identity)
    return isDuplicate
  })
}

function validateRows(rows, rule, context) {
  const filledRows = rows.filter((row) => !isBlankRow(row, rule))
  const rowErrors = Object.assign({}, ...filledRows.map((row) => validateRow(row, rule, context)))
  const correctRows = filledRows.filter(
    (row) => Object.keys(validateRow(row, rule, context)).length === 0,
  )
  const duplicateErrors = Object.fromEntries(
    findDuplicateRows(correctRows, rule).map((row) => [
      rowErrorPath(rule.listName, row.rowId, rule.duplicateField),
      rule.duplicateError,
    ]),
  )
  return { ...rowErrors, ...duplicateErrors }
}

const STEP_VALIDATORS = {
  general: validateGeneral,
  classification: validateClassification,
  fees: validateFeeGroups,
  results: (draft, context) => validateRows(draft.examResultRows, EXAM_RESULT_ROWS_RULE, context),
}

// context = { isCreation, allowedLevelIds, allowedExamIds, openSchoolYears }. Renvoie
// { chemin du champ: clé du message d'erreur } ; un objet vide veut dire que
// l'étape peut être validée.
export function validateStep(stepId, draft, context) {
  return STEP_VALIDATORS[stepId]?.(draft, context) ?? {}
}
