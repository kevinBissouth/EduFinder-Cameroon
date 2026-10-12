import assert from 'node:assert/strict'
import { before, test } from 'node:test'

import i18next from 'i18next'

import { readApiErrorMessage } from './apiError.js'

const GENERIC_ERROR = 'Something went wrong.'

function buildError(responseBody) {
  return { response: { data: responseBody } }
}

before(() =>
  i18next.init({
    lng: 'en',
    resources: {
      en: {
        workspace: {
          genericError: GENERIC_ERROR,
          invalidFields: 'Refused: {{fields}}.',
          content: { contact_email: 'E-mail', fees: 'Fees' },
        },
      },
    },
  }),
)

test('a sentence in detail is shown as is', () => {
  assert.equal(readApiErrorMessage(buildError({ detail: 'Not your school.' })), 'Not your school.')
})

test('refused fields are named by their translated labels, not by the server message', () => {
  const error = buildError({
    contact_email: ['Enter a valid email address.'],
    fees: [{}, { school_year: ['This value does not match the required pattern.'] }],
  })
  assert.equal(readApiErrorMessage(error), 'Refused: E-mail, Fees.')
})

test('a field without a known label falls back to the generic message', () => {
  assert.equal(readApiErrorMessage(buildError({ non_field_errors: ['Invalid.'] })), GENERIC_ERROR)
})

test('an error without a response falls back to the generic message', () => {
  assert.equal(readApiErrorMessage(new Error('Network Error')), GENERIC_ERROR)
})
