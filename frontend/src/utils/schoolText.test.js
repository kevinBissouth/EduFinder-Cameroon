import assert from 'node:assert/strict'
import { test } from 'node:test'

import { pickSchoolText } from './schoolText.js'

const FRENCH_SCHOOL = {
  content_language: 'fr',
  description: 'Un collège bilingue.',
  description_translation: 'A bilingual college.',
  director_bio: 'Elle dirige le collège.',
  director_bio_translation: null,
}

test('a text written in the site language is shown as written', () => {
  assert.deepEqual(pickSchoolText(FRENCH_SCHOOL, 'description', 'fr'), {
    text: 'Un collège bilingue.',
    writtenIn: null,
  })
})

test('the translation replaces the text in the other language', () => {
  assert.deepEqual(pickSchoolText(FRENCH_SCHOOL, 'description', 'en'), {
    text: 'A bilingual college.',
    writtenIn: null,
  })
})

test('without a translation the original is shown and its language is reported', () => {
  assert.deepEqual(pickSchoolText(FRENCH_SCHOOL, 'director_bio', 'en'), {
    text: 'Elle dirige le collège.',
    writtenIn: 'fr',
  })
})

test('a school that never declared its language is shown as written, without a notice', () => {
  const legacySchool = { content_language: null, description: 'Leads the college.' }

  assert.deepEqual(pickSchoolText(legacySchool, 'description', 'fr'), {
    text: 'Leads the college.',
    writtenIn: null,
  })
})

test('a missing text stays empty and reports nothing', () => {
  assert.deepEqual(pickSchoolText({ content_language: 'fr' }, 'director_title', 'en'), {
    text: '',
    writtenIn: null,
  })
})
