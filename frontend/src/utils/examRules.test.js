import assert from 'node:assert/strict'
import { test } from 'node:test'

import { listExamsForType } from './examRules.js'

const EXAMS = [
  { id: 1, name: 'BEPC' },
  { id: 2, name: 'BTS' },
  { id: 3, name: 'New exam' },
]
const ALLOWED_TYPES = { BEPC: ['Secondary general'], BTS: ['Higher institute'] }

test('without a chosen type, every exam is offered', () => {
  assert.deepEqual(listExamsForType(EXAMS, ALLOWED_TYPES, null), EXAMS)
})

test('a chosen type keeps only the exams it sits', () => {
  const names = listExamsForType(EXAMS, ALLOWED_TYPES, 'Secondary general').map((exam) => exam.name)

  assert.deepEqual(names, ['BEPC', 'New exam'])
})

test('an exam missing from the rules is never hidden', () => {
  const names = listExamsForType(EXAMS, ALLOWED_TYPES, 'University').map((exam) => exam.name)

  assert.deepEqual(names, ['New exam'])
})

test('missing rules hide nothing', () => {
  assert.deepEqual(listExamsForType(EXAMS, undefined, 'University'), EXAMS)
})
