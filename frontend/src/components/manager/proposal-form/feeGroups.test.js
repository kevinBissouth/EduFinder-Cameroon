import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  copyFeeGroups,
  createFeeGroup,
  expandFeeGroups,
  findPreviousSchoolYear,
  groupFees,
  listChangedFees,
  listFeeGroupsOfYear,
  listTakenLevelIds,
} from './feeGroups.js'

const TWO_PLANS = ['1 installment', '2 installments']
const PUBLISHED_FEES = [
  { id_level: 70, amount: '50000.00', school_year: '2026-2027', payment_methods: TWO_PLANS },
  { id_level: 71, amount: '50000.00', school_year: '2026-2027', payment_methods: [...TWO_PLANS].reverse() },
  { id_level: 72, amount: '60000.00', school_year: '2026-2027', payment_methods: TWO_PLANS },
  { id_level: 70, amount: '45000.00', school_year: '2025-2026', payment_methods: [] },
]

const summarize = (feeGroups) =>
  feeGroups.map((feeGroup) => [feeGroup.school_year, feeGroup.amount, feeGroup.levelIds])

test('published fees with the same year, amount and plan form one group', () => {
  assert.deepEqual(summarize(groupFees(PUBLISHED_FEES)), [
    ['2026-2027', '50000', ['70', '71']],
    ['2026-2027', '60000', ['72']],
    ['2025-2026', '45000', ['70']],
  ])
})

test('each group gets its own id', () => {
  const groupIds = groupFees(PUBLISHED_FEES).map((feeGroup) => feeGroup.groupId)

  assert.equal(new Set(groupIds).size, groupIds.length)
})

test('a class taken by another amount of the same year is reported, not one of another year', () => {
  const feeGroups = groupFees(PUBLISHED_FEES)
  const [firstGroup] = feeGroups

  assert.deepEqual(listTakenLevelIds(feeGroups, firstGroup), ['72'])
  assert.deepEqual(summarize(listFeeGroupsOfYear(feeGroups, '2025-2026')), [
    ['2025-2026', '45000', ['70']],
  ])
})

test('a complete group expands to one fee per class, an incomplete one to nothing', () => {
  const feeGroups = [
    createFeeGroup('2026-2027', { amount: '50000', levelIds: ['70', '71'], payment_methods: TWO_PLANS }),
    createFeeGroup('2026-2027', { amount: '60000' }),
    createFeeGroup('2026-2027', { levelIds: ['72'] }),
  ]

  assert.deepEqual(expandFeeGroups(feeGroups), [
    { id_level: 70, amount: '50000', school_year: '2026-2027', payment_methods: TWO_PLANS },
    { id_level: 71, amount: '50000', school_year: '2026-2027', payment_methods: TWO_PLANS },
  ])
})

test('untouched published fees are not sent again', () => {
  const feeLines = expandFeeGroups(groupFees(PUBLISHED_FEES))

  assert.deepEqual(listChangedFees(feeLines, PUBLISHED_FEES), [])
})

test('a new amount, a new class and a changed plan are the only fees sent', () => {
  const [firstGroup, secondGroup, pastGroup] = groupFees(PUBLISHED_FEES)
  const editedGroups = [
    { ...firstGroup, levelIds: ['70', '71', '73'] },
    { ...secondGroup, amount: '65000' },
    { ...pastGroup, payment_methods: ['1 installment'] },
  ]

  const changedFees = listChangedFees(expandFeeGroups(editedGroups), PUBLISHED_FEES)

  assert.deepEqual(
    changedFees.map((fee) => [fee.id_level, fee.school_year, fee.amount]),
    [
      [73, '2026-2027', '50000'],
      [72, '2026-2027', '65000'],
      [70, '2025-2026', '45000'],
    ],
  )
})

test('the year before 2026-2027 is 2025-2026', () => {
  assert.equal(findPreviousSchoolYear('2026-2027'), '2025-2026')
})

test('copying a year keeps amounts and plans for the classes still offered', () => {
  const sourceGroups = listFeeGroupsOfYear(groupFees(PUBLISHED_FEES), '2026-2027')
  const allowedLevelIds = new Set(['70', '71'])

  const copiedGroups = copyFeeGroups(sourceGroups, '2027-2028', allowedLevelIds)

  assert.deepEqual(summarize(copiedGroups), [['2027-2028', '50000', ['70', '71']]])
  assert.deepEqual(copiedGroups[0].payment_methods, TWO_PLANS)
  assert.notEqual(copiedGroups[0].groupId, sourceGroups[0].groupId)
})
