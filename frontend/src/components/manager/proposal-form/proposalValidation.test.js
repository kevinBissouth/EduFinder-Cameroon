import assert from 'node:assert/strict'
import { test } from 'node:test'

import { rowErrorPath, validateStep } from './proposalValidation.js'

const EMPTY_FIELDS = {
  name: '',
  phone: '',
  contact_email: '',
  website: '',
  id_city: '',
  id_type: '',
  id_sector: '',
  id_linguistic_section: '',
}

function buildDraft({ fields = {}, feeRows = [], examResultRows = [] } = {}) {
  return { fields: { ...EMPTY_FIELDS, ...fields }, feeRows, examResultRows }
}

const ALLOWED_LEVEL_IDS = new Set(['3'])
const ALLOWED_EXAM_IDS = new Set(['2'])

function buildContext(isCreation) {
  return { isCreation, allowedLevelIds: ALLOWED_LEVEL_IDS, allowedExamIds: ALLOWED_EXAM_IDS }
}

function feeRow(rowId, values) {
  return { rowId, id_level: '', amount: '', school_year: '', payment_methods: [], ...values }
}

function examResultRow(rowId, values) {
  return { rowId, id_exam: '', session: '', pass_rate: '', ...values }
}

test('a modification with untouched empty fields has no error', () => {
  assert.deepEqual(validateStep('general', buildDraft(), buildContext(false)), {})
  assert.deepEqual(validateStep('classification', buildDraft(), buildContext(false)), {})
})

test('a creation requires the name and the four classification fields', () => {
  assert.deepEqual(validateStep('general', buildDraft(), buildContext(true)), { name: 'required' })
  assert.deepEqual(Object.values(validateStep('classification', buildDraft(), buildContext(true))), [
    'required',
    'required',
    'required',
    'required',
  ])
})

test('a one-letter name, a malformed e-mail and a script address are refused', () => {
  const draft = buildDraft({
    fields: { name: 'A', contact_email: 'contact@school', website: 'javascript:alert(1)' },
  })
  assert.deepEqual(validateStep('general', draft, buildContext(false)), {
    name: 'nameTooShort',
    contact_email: 'invalidEmail',
    website: 'invalidWebsite',
  })
})

test('a phone is a Cameroonian number of 9 digits, with or without +237 and spaces', () => {
  const validate = (phone) => validateStep('general', buildDraft({ fields: { phone } }), buildContext(false))
  assert.deepEqual(validate('+237 6 90 11 22 33'), {})
  assert.deepEqual(validate('690112233'), {})
  assert.deepEqual(validate('6571713726'), { phone: 'invalidPhone' })
  assert.deepEqual(validate('+33 690 112 233'), { phone: 'invalidPhone' })
})

test('a website without a scheme or with https is accepted, one with a space is not', () => {
  assert.deepEqual(validateStep('general', buildDraft({ fields: { website: 'school.cm' } }), buildContext(false)), {})
  assert.deepEqual(
    validateStep('general', buildDraft({ fields: { website: 'https://school.cm' } }), buildContext(false)),
    {},
  )
  assert.deepEqual(validateStep('general', buildDraft({ fields: { website: 'school .cm' } }), buildContext(false)), {
    website: 'invalidWebsite',
  })
})

test('a blank fee row is ignored, a started one must be complete and well formed', () => {
  const draft = buildDraft({
    feeRows: [
      feeRow('blank'),
      feeRow('started', { id_level: '3', amount: '0', school_year: '2026/2027' }),
    ],
  })
  assert.deepEqual(validateStep('fees', draft, buildContext(false)), {
    [rowErrorPath('feeRows', 'started', 'amount')]: 'amountPositive',
    [rowErrorPath('feeRows', 'started', 'school_year')]: 'schoolYearFormat',
  })
})

test('the second fee for the same level and year is reported as a duplicate', () => {
  const sameFee = { id_level: '3', amount: '70000', school_year: '2026-2027' }
  const draft = buildDraft({ feeRows: [feeRow('first', sameFee), feeRow('second', sameFee)] })
  assert.deepEqual(validateStep('fees', draft, buildContext(false)), {
    [rowErrorPath('feeRows', 'second', 'school_year')]: 'duplicateFee',
  })
})

test('incomplete rows are not reported as duplicates of each other', () => {
  const draft = buildDraft({
    feeRows: [
      feeRow('first', { school_year: '2026-2027' }),
      feeRow('second', { school_year: '2026-2027' }),
    ],
  })
  const errors = validateStep('fees', draft, buildContext(false))
  assert.ok(!Object.values(errors).includes('duplicateFee'))
})

test('an exam result needs a four-digit session and a rate between 0 and 100', () => {
  const draft = buildDraft({
    examResultRows: [
      examResultRow('valid', { id_exam: '2', session: '2026', pass_rate: '72.5' }),
      examResultRow('invalid', { id_exam: '2', session: '26', pass_rate: '120' }),
    ],
  })
  assert.deepEqual(validateStep('results', draft, buildContext(false)), {
    [rowErrorPath('examResultRows', 'invalid', 'session')]: 'sessionFormat',
    [rowErrorPath('examResultRows', 'invalid', 'pass_rate')]: 'passRateRange',
  })
})

test('a class or an exam the school cannot offer is reported', () => {
  const draft = buildDraft({
    feeRows: [feeRow('fee', { id_level: '9', amount: '70000', school_year: '2026-2027' })],
    examResultRows: [examResultRow('result', { id_exam: '8', session: '2026', pass_rate: '80' })],
  })
  assert.deepEqual(validateStep('fees', draft, buildContext(true)), {
    [rowErrorPath('feeRows', 'fee', 'id_level')]: 'levelNotOffered',
  })
  assert.deepEqual(validateStep('results', draft, buildContext(true)), {
    [rowErrorPath('examResultRows', 'result', 'id_exam')]: 'examNotOffered',
  })
})

test('a step without checks is always valid', () => {
  assert.deepEqual(validateStep('services', buildDraft(), buildContext(true)), {})
})
