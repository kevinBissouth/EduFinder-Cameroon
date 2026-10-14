import assert from 'node:assert/strict'
import { test } from 'node:test'

import { cleanDraftForSchoolProfile } from './draftCleanup.js'

// Un brouillon de primaire : des frais de CM1 et CM2, un CEP, et rien d'autre.
const PRIMARY_DRAFT = {
  fields: { name: 'École de test' },
  feeGroups: [
    { groupId: 'primary', amount: '50000', levelIds: ['68', '69'] },
    { groupId: 'mixed', amount: '60000', levelIds: ['69b', '70'] },
    { groupId: 'started', amount: '70000', levelIds: [] },
  ],
  examResultRows: [
    { rowId: 'cep', id_exam: '17', session: '2026', pass_rate: '80' },
    { rowId: 'bepc', id_exam: '18', session: '2026', pass_rate: '75' },
    { rowId: 'started', id_exam: '', session: '', pass_rate: '' },
  ],
  programIds: [15, 16],
}

// Ce qu'un collège général peut proposer : la 6e (70) et le BEPC (18).
const GENERAL_SECONDARY = {
  levelIds: new Set(['70']),
  examIds: new Set(['18']),
  supportsPrograms: true,
}

test('classes and exams that no longer fit are removed, the others are kept', () => {
  const { draft, hasRemovedSomething } = cleanDraftForSchoolProfile(PRIMARY_DRAFT, GENERAL_SECONDARY)

  assert.equal(hasRemovedSomething, true)
  assert.deepEqual(
    draft.feeGroups.map((feeGroup) => [feeGroup.groupId, feeGroup.levelIds]),
    [
      ['mixed', ['70']],
      ['started', []],
    ],
  )
  assert.deepEqual(
    draft.examResultRows.map((examResultRow) => examResultRow.rowId),
    ['bepc', 'started'],
  )
})

test('an amount that loses all its classes goes with them, one being typed stays', () => {
  const { draft } = cleanDraftForSchoolProfile(PRIMARY_DRAFT, GENERAL_SECONDARY)
  const groupIds = draft.feeGroups.map((feeGroup) => feeGroup.groupId)

  assert.ok(!groupIds.includes('primary'))
  assert.ok(groupIds.includes('started'))
})

test('programmes are cleared for a type that has none', () => {
  const nursery = { levelIds: new Set(), examIds: new Set(), supportsPrograms: false }

  const { draft, hasRemovedSomething } = cleanDraftForSchoolProfile(PRIMARY_DRAFT, nursery)

  assert.deepEqual(draft.programIds, [])
  assert.equal(hasRemovedSomething, true)
})

test('a draft that already fits is returned unchanged and nothing is reported', () => {
  const everythingAllowed = {
    levelIds: new Set(['68', '69', '69b', '70']),
    examIds: new Set(['17', '18']),
    supportsPrograms: true,
  }

  const { draft, hasRemovedSomething } = cleanDraftForSchoolProfile(PRIMARY_DRAFT, everythingAllowed)

  assert.equal(hasRemovedSomething, false)
  assert.deepEqual(draft, PRIMARY_DRAFT)
})

test('the other parts of the draft are left alone', () => {
  const { draft } = cleanDraftForSchoolProfile(PRIMARY_DRAFT, GENERAL_SECONDARY)

  assert.deepEqual(draft.fields, PRIMARY_DRAFT.fields)
})
