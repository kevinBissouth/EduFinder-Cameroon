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

function buildDraft({ fields = {}, feeGroups = [], examResultRows = [] } = {}) {
  return { fields: { ...EMPTY_FIELDS, ...fields }, feeGroups, examResultRows }
}

const ALLOWED_LEVEL_IDS = new Set(['3'])
const ALLOWED_EXAM_IDS = new Set(['2'])

const OPEN_YEAR = '2026-2027'
const PAST_YEAR = '2025-2026'

function buildContext(isCreation) {
  return {
    isCreation,
    allowedLevelIds: ALLOWED_LEVEL_IDS,
    allowedExamIds: ALLOWED_EXAM_IDS,
    openSchoolYears: [OPEN_YEAR, '2027-2028'],
  }
}

function feeGroup(groupId, values) {
  return {
    groupId,
    school_year: OPEN_YEAR,
    amount: '',
    payment_methods: [],
    levelIds: [],
    ...values,
  }
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

test('a blank amount is ignored, a started one needs an amount above zero and a class', () => {
  const draft = buildDraft({
    feeGroups: [
      feeGroup('blank'),
      feeGroup('no-class', { amount: '50000' }),
      feeGroup('no-amount', { levelIds: ['3'] }),
      feeGroup('zero', { amount: '0', levelIds: ['3'] }),
    ],
  })
  assert.deepEqual(validateStep('fees', draft, buildContext(false)), {
    [rowErrorPath('feeGroups', 'no-class', 'levelIds')]: 'classesRequired',
    [rowErrorPath('feeGroups', 'no-amount', 'amount')]: 'required',
    [rowErrorPath('feeGroups', 'zero', 'amount')]: 'amountPositive',
  })
})

test('an amount with its classes is valid', () => {
  const draft = buildDraft({ feeGroups: [feeGroup('complete', { amount: '50000', levelIds: ['3'] })] })

  assert.deepEqual(validateStep('fees', draft, buildContext(true)), {})
})

test('the amounts of a past school year are neither checked nor blocking', () => {
  const draft = buildDraft({
    feeGroups: [feeGroup('history', { school_year: PAST_YEAR, amount: '0', levelIds: ['9'] })],
  })

  assert.deepEqual(validateStep('fees', draft, buildContext(false)), {})
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
    feeGroups: [feeGroup('fee', { amount: '70000', levelIds: ['3', '9'] })],
    examResultRows: [examResultRow('result', { id_exam: '8', session: '2026', pass_rate: '80' })],
  })
  assert.deepEqual(validateStep('fees', draft, buildContext(true)), {
    [rowErrorPath('feeGroups', 'fee', 'levelIds')]: 'levelNotOffered',
  })
  assert.deepEqual(validateStep('results', draft, buildContext(true)), {
    [rowErrorPath('examResultRows', 'result', 'id_exam')]: 'examNotOffered',
  })
})

test('a step without checks is always valid', () => {
  assert.deepEqual(validateStep('services', buildDraft(), buildContext(true)), {})
})
