import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildComparisonHash,
  canCompare,
  includesAllIds,
  isComparisonFull,
  isSameSelection,
  normalizeComparedIds,
  parseComparisonPath,
} from './comparison.js'
import { parseRoute } from '../routes.js'

test('a selection keeps four distinct schools at most', () => {
  assert.deepEqual(normalizeComparedIds(['a', 'b', 'a', '', ' c ', 'd', 'e', 'f']), ['a', 'b', 'c', 'd'])
})

test('the shareable address round-trips through the route parser', () => {
  const hash = buildComparisonHash(['a', 'b', 'c'])

  assert.equal(hash, '#/compare/a,b,c')
  assert.deepEqual(parseRoute(hash), { page: 'compare', ids: ['a', 'b', 'c'] })
})

test('a link with six schools shows the first four', () => {
  assert.deepEqual(parseRoute('#/compare/a,b,c,d,e,f').ids, ['a', 'b', 'c', 'd'])
})

test('a link without any school still opens the comparison page, empty', () => {
  assert.deepEqual(parseRoute('#/compare/'), { page: 'compare', ids: [] })
})

test('another path is not a comparison', () => {
  assert.equal(parseComparisonPath('/school/a'), null)
})

test('known routes keep working', () => {
  assert.deepEqual(parseRoute('#/school/abc'), { page: 'school-detail', id: 'abc' })
  assert.deepEqual(parseRoute('#/saved'), { page: 'saved' })
  assert.deepEqual(parseRoute('#/login'), { page: 'login' })
  assert.deepEqual(parseRoute('#results'), { page: 'home' })
  assert.deepEqual(parseRoute(''), { page: 'home' })
})

test('comparing needs two schools and stops at four', () => {
  assert.equal(canCompare(['a']), false)
  assert.equal(canCompare(['a', 'b']), true)
  assert.equal(isComparisonFull(['a', 'b', 'c']), false)
  assert.equal(isComparisonFull(['a', 'b', 'c', 'd']), true)
})

test('two selections are the same whatever their order', () => {
  assert.equal(isSameSelection(['a', 'b'], ['b', 'a']), true)
  assert.equal(isSameSelection(['a', 'b'], ['a']), false)
  assert.equal(isSameSelection(['a', 'b'], ['a', 'c']), false)
  assert.equal(isSameSelection([], []), true)
})

test('a comparison with one school removed is still part of the selection', () => {
  assert.equal(includesAllIds(['a', 'b', 'c'], ['a', 'c']), true)
  assert.equal(includesAllIds(['a', 'b'], ['a', 'z']), false)
})
