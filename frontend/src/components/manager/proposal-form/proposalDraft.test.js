import assert from 'node:assert/strict'
import { test } from 'node:test'

import { groupFees } from './feeGroups.js'
import {
  buildInitialFields,
  buildProposalContent,
  buildPublishedRecord,
  createExamResultRow,
} from './proposalDraft.js'

const OPEN_SCHOOL_YEARS = ['2026-2027', '2027-2028']
const PROGRAMS = [
  { id: 4, name: 'Génie civil' },
  { id: 5, name: 'Génie électrique' },
]

const SCHOOL = {
  name: 'Lycée Technique',
  detail: {
    phone: '+237690112233',
    id_city: 19,
    id_type: 30,
    id_sector: 2,
    id_linguistic_section: 7,
    type: 'Secondary technical',
    description: 'Un lycée technique.',
    website: 'https://lycee.cm',
    director_title: 'Proviseur',
    fees: [
      { id_level: 3, school_year: '2026-2027', amount: '50000.00', payment_methods: ['1 tranche'] },
    ],
    exam_results: [
      { id_exam: 1, session: '2024', pass_rate: '70.00' },
      { id_exam: 1, session: '2025', pass_rate: '72.50' },
    ],
    services: [{ name: 'Cantine' }, { name: 'Bibliothèque' }],
    programs: ['Génie civil'],
  },
}

// Le brouillon tel que l'assistant l'ouvre, sans aucune retouche.
function buildUntouchedDraft(school) {
  const publishedRecord = buildPublishedRecord(school, PROGRAMS)
  return {
    fields: buildInitialFields(school),
    feeGroups: groupFees(publishedRecord.fees),
    examResultRows: publishedRecord.examResults.map(createExamResultRow),
    serviceNames: publishedRecord.serviceNames,
    programIds: publishedRecord.programIds,
    coverPhotoUrl: '',
    directorPhotoUrl: '',
    videoUrls: [],
  }
}

function buildContent(draft, school) {
  return buildProposalContent(draft, {
    ...buildPublishedRecord(school, PROGRAMS),
    openSchoolYears: OPEN_SCHOOL_YEARS,
  })
}

test('the form starts from the phone and the reference choices of the profile', () => {
  const fields = buildInitialFields(SCHOOL)

  assert.equal(fields.phone, '+237690112233')
  assert.deepEqual(
    [fields.id_city, fields.id_type, fields.id_sector, fields.id_linguistic_section],
    ['19', '30', '2', '7'],
  )
})

test('an untouched modification has nothing to send', () => {
  assert.deepEqual(buildContent(buildUntouchedDraft(SCHOOL), SCHOOL), {})
})

test('a modification only sends the fields that differ from the profile', () => {
  const draft = buildUntouchedDraft(SCHOOL)
  draft.fields = { ...draft.fields, phone: '+237677000000', id_type: '31' }

  assert.deepEqual(buildContent(draft, SCHOOL), { phone: '+237677000000', id_type: 31 })
})

// Le titre pré-rempli d'après le type n'est pas publié : il part, même si le
// responsable ne l'a pas retouché.
test('a head title suggested by the type is sent when the profile has none', () => {
  const schoolWithoutTitle = { ...SCHOOL, detail: { ...SCHOOL.detail, director_title: '' } }
  const draft = buildUntouchedDraft(schoolWithoutTitle)
  draft.fields = buildInitialFields(schoolWithoutTitle, { 'Secondary technical': ['Proviseur'] })

  assert.deepEqual(buildContent(draft, schoolWithoutTitle), { director_title: 'Proviseur' })
})

test('only the new and corrected exam results are sent', () => {
  const draft = buildUntouchedDraft(SCHOOL)
  const [result2024, result2025] = draft.examResultRows
  draft.examResultRows = [
    result2024,
    { ...result2025, pass_rate: '74' },
    { ...createExamResultRow(), id_exam: '2', session: '2025', pass_rate: '60' },
  ]

  assert.deepEqual(buildContent(draft, SCHOOL).exam_results, [
    { id_exam: 1, session: '2025', pass_rate: 74 },
    { id_exam: 2, session: '2025', pass_rate: 60 },
  ])
})

test('the services and programmes are sent only when they differ', () => {
  const draft = buildUntouchedDraft(SCHOOL)
  draft.serviceNames = ['Bibliothèque', 'Cantine']
  draft.programIds = [5, 4]

  assert.deepEqual(buildContent(draft, SCHOOL), { program_ids: [5, 4] })
})

// Une liste vidée part vide : c'est ainsi que le responsable retire tous ses
// services.
test('an emptied list is sent empty', () => {
  const draft = buildUntouchedDraft(SCHOOL)
  draft.serviceNames = []

  assert.deepEqual(buildContent(draft, SCHOOL), { services: [] })
})

test('a creation sends everything that is filled in', () => {
  const draft = buildUntouchedDraft(null)
  draft.fields = { ...draft.fields, name: 'Nouvelle École', id_city: '19' }
  draft.serviceNames = ['Cantine']
  draft.videoUrls = ['/media/video.mp4']

  assert.deepEqual(buildContent(draft, null), {
    name: 'Nouvelle École',
    id_city: 19,
    services: ['Cantine'],
    videos: ['/media/video.mp4'],
  })
})
