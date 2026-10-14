import assert from 'node:assert/strict'
import { test } from 'node:test'

import { findDraftKey, pickSavedDraft } from './draftStorage.js'

const PROFILE_VERSION = '2026-10-14T09:00:00Z'
const DRAFT = { fields: { phone: '+237677000000' } }

function savedText(profileVersion) {
  return JSON.stringify({ profileVersion, stepIndex: 3, draft: DRAFT })
}

test('each profile has its own draft, a creation has one too', () => {
  assert.notEqual(findDraftKey({ establishment_uuid: 'a' }), findDraftKey({ establishment_uuid: 'b' }))
  assert.equal(findDraftKey(null), findDraftKey(undefined))
})

test('a draft saved for the current version of the profile is taken back', () => {
  const { savedDraft, isOutdated } = pickSavedDraft(savedText(PROFILE_VERSION), PROFILE_VERSION)

  assert.deepEqual(savedDraft.draft, DRAFT)
  assert.equal(savedDraft.stepIndex, 3)
  assert.equal(isOutdated, false)
})

test('a draft saved before the profile changed is set aside, and said so', () => {
  const result = pickSavedDraft(savedText('2026-10-01T09:00:00Z'), PROFILE_VERSION)

  assert.deepEqual(result, { savedDraft: null, isOutdated: true })
})

test('nothing saved, or an unreadable text, gives no draft', () => {
  const noDraft = { savedDraft: null, isOutdated: false }

  assert.deepEqual(pickSavedDraft(null, PROFILE_VERSION), noDraft)
  assert.deepEqual(pickSavedDraft('{pas du json', PROFILE_VERSION), noDraft)
  assert.deepEqual(pickSavedDraft('{"other":1}', PROFILE_VERSION), noDraft)
})
