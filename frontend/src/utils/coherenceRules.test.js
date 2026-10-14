import assert from 'node:assert/strict'
import { test } from 'node:test'

import { listExamsForSchool, listLevelsForSchool } from './coherenceRules.js'

const EXAMS = [
  { id: 1, name: 'BEPC' },
  { id: 2, name: 'BTS' },
  { id: 3, name: 'GCE O-Level' },
  { id: 4, name: 'New exam' },
  { id: 5, name: 'CAP' },
]
const LEVELS = [
  { id: 1, stage: 'Maternelle', label: 'Petite Section' },
  { id: 2, stage: 'Primaire', label: 'CM1' },
  { id: 3, stage: 'Primary', label: 'Class 4' },
  { id: 4, stage: 'Collège', label: '4e' },
  { id: 5, stage: 'Higher', label: 'Licence 1' },
  { id: 6, stage: 'New stage', label: 'New class' },
  { id: 7, stage: 'Technical lower secondary', label: '1ère année' },
]
const GENERAL_TYPE = ['Secondary general']
const TECHNICAL_TYPE = ['Secondary technical']
const RULES = {
  exam_allowed_types: {
    BEPC: [...GENERAL_TYPE, ...TECHNICAL_TYPE],
    'GCE O-Level': GENERAL_TYPE,
    CAP: TECHNICAL_TYPE,
    BTS: ['Higher institute'],
  },
  exam_families: {
    BEPC: 'francophone',
    BTS: 'francophone',
    CAP: 'francophone',
    'GCE O-Level': 'anglophone',
  },
  section_free_exam_types: TECHNICAL_TYPE,
  stage_allowed_types: {
    Maternelle: ['Nursery', 'Primary'],
    Primaire: ['Primary'],
    Primary: ['Primary'],
    Collège: GENERAL_TYPE,
    'Technical lower secondary': TECHNICAL_TYPE,
    Higher: ['Higher institute', 'University'],
  },
  stage_families: { Maternelle: 'francophone', Primaire: 'francophone', Primary: 'anglophone', Collège: 'francophone' },
  section_families: {
    Francophone: ['francophone'],
    Anglophone: ['anglophone'],
    Bilingual: ['anglophone', 'francophone'],
  },
}

const listNames = (exams) => exams.map((exam) => exam.name)
const listLabels = (levels) => levels.map((level) => level.label)

test('without a chosen type or section, everything is offered', () => {
  assert.deepEqual(listExamsForSchool(EXAMS, RULES, {}), EXAMS)
  assert.deepEqual(listLevelsForSchool(LEVELS, RULES, {}), LEVELS)
})

test('a chosen type keeps only the exams it sits', () => {
  const exams = listExamsForSchool(EXAMS, RULES, { typeName: 'Secondary general' })

  assert.deepEqual(listNames(exams), ['BEPC', 'GCE O-Level', 'New exam'])
})

test('the section keeps only the exams of its school system', () => {
  const school = { typeName: 'Secondary general', sectionName: 'Francophone' }

  assert.deepEqual(listNames(listExamsForSchool(EXAMS, RULES, school)), ['BEPC', 'New exam'])
})

test('an exam or a stage missing from the rules is never hidden', () => {
  const school = { typeName: 'University', sectionName: 'Anglophone' }

  assert.deepEqual(listNames(listExamsForSchool(EXAMS, RULES, school)), ['New exam'])
  assert.deepEqual(listLabels(listLevelsForSchool(LEVELS, RULES, school)), ['Licence 1', 'New class'])
})

test('missing rules hide nothing', () => {
  assert.deepEqual(listExamsForSchool(EXAMS, undefined, { typeName: 'University' }), EXAMS)
})

test('a francophone primary school sees its nursery and primary classes only', () => {
  const school = { typeName: 'Primary', sectionName: 'Francophone' }

  assert.deepEqual(listLabels(listLevelsForSchool(LEVELS, RULES, school)), [
    'Petite Section',
    'CM1',
    'New class',
  ])
})

test('an anglophone primary school is not offered CM1', () => {
  const school = { typeName: 'Primary', sectionName: 'Anglophone' }

  assert.deepEqual(listLabels(listLevelsForSchool(LEVELS, RULES, school)), ['Class 4', 'New class'])
})

test('a bilingual school sees the classes of both systems', () => {
  const school = { typeName: 'Primary', sectionName: 'Bilingual' }

  assert.deepEqual(listLabels(listLevelsForSchool(LEVELS, RULES, school)), [
    'Petite Section',
    'CM1',
    'Class 4',
    'New class',
  ])
})

test('a general secondary school is offered neither nursery nor primary classes', () => {
  const school = { typeName: 'Secondary general', sectionName: 'Francophone' }

  assert.deepEqual(listLabels(listLevelsForSchool(LEVELS, RULES, school)), ['4e', 'New class'])
})

test('a technical school has the same exams and classes in every section', () => {
  const sections = ['Francophone', 'Anglophone', 'Bilingual']

  sections.forEach((sectionName) => {
    const school = { typeName: 'Secondary technical', sectionName }
    assert.deepEqual(listNames(listExamsForSchool(EXAMS, RULES, school)), ['BEPC', 'New exam', 'CAP'])
    assert.deepEqual(listLabels(listLevelsForSchool(LEVELS, RULES, school)), [
      'New class',
      '1ère année',
    ])
  })
})

test('an anglophone general school keeps the GCE and is not offered the CAP', () => {
  const school = { typeName: 'Secondary general', sectionName: 'Anglophone' }

  assert.deepEqual(listNames(listExamsForSchool(EXAMS, RULES, school)), ['GCE O-Level', 'New exam'])
})

test('lists not loaded yet give an empty list instead of failing', () => {
  assert.deepEqual(listExamsForSchool(undefined, undefined, { typeName: 'Primary' }), [])
  assert.deepEqual(listLevelsForSchool(undefined), [])
})
