import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  EXAM_SESSION_YEARS_OFFERED,
  createSessionRows,
  findExamIdsToPrefill,
  findLatestEnteredSession,
  listSessionChoices,
  listSessionsWithErrors,
  listTakenExamIds,
} from './examSessions.js'

const EXAMS = [
  { id: 1, name: 'BEPC' },
  { id: 2, name: 'Probatoire' },
  { id: 3, name: 'Baccalauréat' },
]

function examResultRow(rowId, values) {
  return { rowId, id_exam: '', session: '', pass_rate: '', ...values }
}

test('the session choices run from the latest session back over the offered years', () => {
  const sessionChoices = listSessionChoices([], '2026')

  assert.equal(sessionChoices.length, EXAM_SESSION_YEARS_OFFERED)
  assert.equal(sessionChoices[0], '2026')
  assert.equal(sessionChoices.at(-1), String(2026 - EXAM_SESSION_YEARS_OFFERED + 1))
})

test('an older entered session stays among the choices, newest first', () => {
  const rows = [examResultRow('old', { id_exam: '1', session: '2001', pass_rate: '60' })]

  const sessionChoices = listSessionChoices(rows, '2026')

  assert.equal(sessionChoices.at(-1), '2001')
  assert.equal(sessionChoices.length, EXAM_SESSION_YEARS_OFFERED + 1)
})

test('without a known latest session, only the entered sessions are offered', () => {
  const rows = [examResultRow('a', { id_exam: '1', session: '2024', pass_rate: '60' })]

  assert.deepEqual(listSessionChoices(rows, ''), ['2024'])
})

test('the latest entered session is the most recent one with a row', () => {
  const rows = [
    examResultRow('a', { id_exam: '1', session: '2024' }),
    examResultRow('b', { id_exam: '1', session: '2025' }),
  ]

  assert.equal(findLatestEnteredSession(rows), '2025')
  assert.equal(findLatestEnteredSession([]), null)
})

test('a new session starts from the exams of the latest entered session', () => {
  const rows = [
    examResultRow('a', { id_exam: '3', session: '2025', pass_rate: '70' }),
    examResultRow('b', { id_exam: '1', session: '2025', pass_rate: '80' }),
    examResultRow('c', { id_exam: '2', session: '2024', pass_rate: '75' }),
  ]

  const examIds = findExamIdsToPrefill(rows, EXAMS, new Set(['1', '2', '3']))

  // Dans l'ordre de la liste des examens, pas dans celui de la saisie.
  assert.deepEqual(examIds, ['1', '3'])
})

test('an exam the school can no longer sit is not prefilled', () => {
  const rows = [
    examResultRow('a', { id_exam: '1', session: '2025', pass_rate: '80' }),
    examResultRow('b', { id_exam: '2', session: '2025', pass_rate: '70' }),
  ]

  assert.deepEqual(findExamIdsToPrefill(rows, EXAMS, new Set(['2', '3'])), ['2'])
})

test('without history, a new session offers every exam the school can sit', () => {
  assert.deepEqual(findExamIdsToPrefill([], EXAMS, new Set(['2', '3'])), ['2', '3'])
})

test('the rows of a new session carry their exam and session, rate left empty', () => {
  const rows = createSessionRows(['1', '3'], '2026')

  assert.deepEqual(
    rows.map(({ id_exam, session, pass_rate }) => ({ id_exam, session, pass_rate })),
    [
      { id_exam: '1', session: '2026', pass_rate: '' },
      { id_exam: '3', session: '2026', pass_rate: '' },
    ],
  )
  assert.notEqual(rows[0].rowId, rows[1].rowId)
})

test('an exam already on another row of the same session is taken', () => {
  const editedRow = examResultRow('edited', { id_exam: '2', session: '2025' })
  const rows = [
    editedRow,
    examResultRow('same-session', { id_exam: '1', session: '2025' }),
    examResultRow('other-session', { id_exam: '3', session: '2024' }),
  ]

  assert.deepEqual(listTakenExamIds(rows, editedRow), ['1'])
})

test('the sessions with errors are listed once, newest first', () => {
  const rows = [
    examResultRow('a', { session: '2023' }),
    examResultRow('b', { session: '2025' }),
    examResultRow('c', { session: '2025' }),
    examResultRow('d', { session: '2024' }),
  ]
  const rowsWithErrors = new Set(['a', 'b', 'c'])

  const sessions = listSessionsWithErrors(rows, (row) => rowsWithErrors.has(row.rowId))

  assert.deepEqual(sessions, ['2025', '2023'])
})
