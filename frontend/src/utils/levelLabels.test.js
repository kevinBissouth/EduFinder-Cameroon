import assert from 'node:assert/strict'
import { test } from 'node:test'

import { labelLevelOptions } from './levelLabels.js'

const STAGE_TRANSLATIONS = { 'Lower secondary': 'Premier cycle du secondaire', Collège: 'Collège' }
const translateStage = (stage) => STAGE_TRANSLATIONS[stage] ?? stage

const listNames = (levels) => labelLevelOptions(levels, translateStage).map((level) => level.name)

test('a class is named by its label alone, without its stage', () => {
  const levels = [
    { id: 35, stage: 'Lower secondary', label: 'Form 1', name: 'Lower secondary — Form 1' },
    { id: 70, stage: 'Collège', label: '6e', name: 'Collège — 6e' },
  ]

  assert.deepEqual(listNames(levels), ['Form 1', '6e'])
})

test('two classes with the same label, and only those, get their translated stage', () => {
  const levels = [
    { id: 1, stage: 'Primaire', label: 'Niveau 1' },
    { id: 2, stage: 'Lower secondary', label: 'Niveau 1' },
    { id: 3, stage: 'Primaire', label: 'CM1' },
  ]

  assert.deepEqual(listNames(levels), [
    'Primaire — Niveau 1',
    'Premier cycle du secondaire — Niveau 1',
    'CM1',
  ])
})

test('the other fields of a level are kept', () => {
  const [level] = labelLevelOptions([{ id: 35, stage: 'Lower secondary', label: 'Form 1' }], translateStage)

  assert.deepEqual(level, { id: 35, stage: 'Lower secondary', label: 'Form 1', name: 'Form 1' })
})

test('an empty list gives an empty list', () => {
  assert.deepEqual(labelLevelOptions([], translateStage), [])
})
