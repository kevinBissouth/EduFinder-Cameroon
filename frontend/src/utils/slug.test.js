import assert from 'node:assert/strict'
import { test } from 'node:test'

import { toSlug } from './slug.js'
import { buildSchoolPath, isSitePath, parseRoute, readLegacyHashPath } from '../routes.js'

test('a school name becomes a lowercase address without accents', () => {
  assert.equal(toSlug('Collège Moderne Bilingue de Yaoundé'), 'college-moderne-bilingue-de-yaounde')
  assert.equal(toSlug("  Institut d'Ingénierie (ISIT) "), 'institut-d-ingenierie-isit')
})

test('a school address carries the name after the identifier, and parses back', () => {
  const path = buildSchoolPath('abc', 'École Les Palmiers')

  assert.equal(path, '/school/abc/ecole-les-palmiers')
  assert.deepEqual(parseRoute(path), { page: 'school-detail', id: 'abc' })
})

test('a school without a usable name keeps a bare address', () => {
  assert.equal(buildSchoolPath('abc'), '/school/abc')
  assert.equal(buildSchoolPath('abc', '!!!'), '/school/abc')
})

test('an old hash link gives back the path it pointed to', () => {
  assert.equal(readLegacyHashPath('#/school/abc'), '/school/abc')
  assert.equal(readLegacyHashPath('#results'), null)
  assert.equal(readLegacyHashPath(''), null)
})

test('only pages of the site are handled without a reload', () => {
  assert.equal(isSitePath('/'), true)
  assert.equal(isSitePath('/compare/a,b'), true)
  assert.equal(isSitePath('/login'), true)
  assert.equal(isSitePath('/media/photo.jpg'), false)
  assert.equal(isSitePath('/institutions'), false)
})
