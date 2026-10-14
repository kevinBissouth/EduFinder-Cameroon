import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createUniqueId } from './uniqueId.js'

const ID_COUNT = 50

function countDistinct(ids) {
  return new Set(ids).size
}

test('with crypto.randomUUID available, its value is used', () => {
  const cryptoSource = { randomUUID: () => 'generated-by-crypto' }

  assert.equal(createUniqueId(cryptoSource), 'generated-by-crypto')
})

test('on an insecure address, where crypto.randomUUID is missing, ids are still unique', () => {
  const insecureCrypto = {}
  const ids = Array.from({ length: ID_COUNT }, () => createUniqueId(insecureCrypto))

  assert.equal(countDistinct(ids), ID_COUNT)
})

test('without any crypto object, an id is still produced', () => {
  assert.equal(typeof createUniqueId(null), 'string')
})

test('by default the ids of the running environment are unique', () => {
  const ids = Array.from({ length: ID_COUNT }, () => createUniqueId())

  assert.equal(countDistinct(ids), ID_COUNT)
})
