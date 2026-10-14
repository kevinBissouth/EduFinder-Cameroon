import assert from 'node:assert/strict'
import { test } from 'node:test'

import { findHeadTitle, pickHeadTitleForType } from './headTitle.js'

const HEAD_TITLE_LABELS = {
  Proviseur: { fr: 'Proviseur', en: 'Principal' },
  Headmistress: { fr: 'Directrice', en: 'Headmistress' },
  Dean: { fr: 'Doyen', en: 'Dean' },
}
const PRIMARY_TITLES = ['Headmaster', 'Headmistress']
const SECONDARY_TITLES = ['Proviseur', 'Principal', 'Principale']

test('a title of the list is shown in the site language, whatever the school language', () => {
  const school = { director_title: 'Headmistress', content_language: 'en' }

  assert.equal(findHeadTitle(school, HEAD_TITLE_LABELS, 'fr').text, 'Directrice')
  assert.equal(findHeadTitle(school, HEAD_TITLE_LABELS, 'en').text, 'Headmistress')
})

test('a list title ignores a stale translation left on the profile', () => {
  const school = {
    director_title: 'Dean',
    director_title_translation: 'Principal',
    content_language: 'fr',
  }

  assert.equal(findHeadTitle(school, HEAD_TITLE_LABELS, 'en').text, 'Dean')
})

test('a free title of an older profile follows the rule of the other school texts', () => {
  const school = {
    director_title: 'Fondatrice',
    director_title_translation: 'Founder',
    content_language: 'fr',
  }

  assert.equal(findHeadTitle(school, HEAD_TITLE_LABELS, 'fr').text, 'Fondatrice')
  assert.equal(findHeadTitle(school, HEAD_TITLE_LABELS, 'en').text, 'Founder')
})

test('a free title without a translation reports the language it was written in', () => {
  const school = { director_title: 'Fondatrice', content_language: 'fr' }

  assert.deepEqual(findHeadTitle(school, HEAD_TITLE_LABELS, 'en'), {
    text: 'Fondatrice',
    writtenIn: 'fr',
  })
  assert.equal(findHeadTitle({ ...school, director_title: 'Proviseur' }, HEAD_TITLE_LABELS, 'en').writtenIn, null)
})

test('a profile without a title gives an empty text', () => {
  assert.equal(findHeadTitle({ director_title: null }, HEAD_TITLE_LABELS, 'fr').text, '')
  assert.equal(findHeadTitle({ director_title: 'Proviseur' }, undefined, 'fr').text, 'Proviseur')
})

test('an empty title takes the first title of the type', () => {
  assert.equal(pickHeadTitleForType('', [], PRIMARY_TITLES), 'Headmaster')
})

test('a title of the previous type follows the new type', () => {
  assert.equal(pickHeadTitleForType('Headmistress', PRIMARY_TITLES, SECONDARY_TITLES), 'Proviseur')
})

test('a title the new type also has is kept', () => {
  assert.equal(pickHeadTitleForType('Principale', SECONDARY_TITLES, SECONDARY_TITLES), 'Principale')
})

test('a free title already published is not replaced by a type change', () => {
  assert.equal(
    pickHeadTitleForType('Founding Director', PRIMARY_TITLES, SECONDARY_TITLES),
    'Founding Director',
  )
})

test('a type without known titles leaves an empty title empty', () => {
  assert.equal(pickHeadTitleForType('', PRIMARY_TITLES, undefined), '')
})
