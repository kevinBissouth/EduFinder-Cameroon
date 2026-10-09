import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  EXAM_STATUS,
  buildContactLinks,
  buildExamComparison,
  buildFeeComparison,
  buildKeyFigures,
  buildProfileFacts,
  findCoverUrl,
  findSharedItems,
} from './comparisonView.js'

// Traducteur factice : il rend ce qu'on lui donne, pour lire dans les
// résultats quelle clé a été utilisée.
const translateReference = (kind, key) => (key ? `${kind}:${key}` : '')

const COLLEGE = {
  type: 'Secondary general',
  sector: 'public',
  linguistic_section: 'Bilingual',
  city: 'Yaoundé',
  region: 'Centre',
  phone: '699000000',
  contact_email: null,
  website: '',
  fees: [
    { amount: '50000.00', school_year: '2025-2026', payment_methods: ['1 installment'] },
    { amount: '70000.00', school_year: '2026-2027', payment_methods: ['1 installment', '2 installments'] },
    { amount: '90000.00', school_year: '2026-2027', payment_methods: ['2 installments'] },
  ],
  exam_results: [
    { exam: 'BEPC', session: '2024', pass_rate: '60.00' },
    { exam: 'BEPC', session: '2025', pass_rate: '72.50' },
  ],
}

const UNIVERSITY = {
  type: 'University',
  sector: 'private',
  linguistic_section: 'Bilingual',
  city: 'Garoua',
  region: 'North',
  fees: [{ amount: '180000.00', school_year: '2026-2027', payment_methods: [] }],
  exam_results: [],
}

test('every fact is listed per school, and the shared ones are also set apart', () => {
  const profile = buildProfileFacts([COLLEGE, UNIVERSITY], translateReference)

  assert.deepEqual(profile.shared, [{ id: 'section', value: 'sections:Bilingual' }])
  assert.deepEqual(
    profile.facts.map((fact) => fact.id),
    ['type', 'sector', 'section', 'location'],
  )
  assert.deepEqual(profile.facts[3].values, ['Yaoundé, regions:Centre', 'Garoua, regions:North'])
})

test('a fact nobody published is not counted as shared', () => {
  const silentSchool = { ...COLLEGE, linguistic_section: null }
  const profile = buildProfileFacts([silentSchool, silentSchool], translateReference)

  assert.equal(profile.shared.some((fact) => fact.id === 'section'), false)
  assert.deepEqual(profile.facts.find((fact) => fact.id === 'section').values, [null, null])
})

test('fees come from the most recent school year only', () => {
  const [collegeFees] = buildFeeComparison([COLLEGE])

  assert.equal(collegeFees.schoolYear, '2026-2027')
  assert.equal(collegeFees.lowestAmount, 70000)
  assert.equal(collegeFees.highestAmount, 90000)
  assert.deepEqual(collegeFees.paymentMethods, ['1 installment', '2 installments'])
})

test('the fee of each class of the latest year is kept', () => {
  const school = {
    fees: [
      { amount: '70000.00', school_year: '2026-2027', class: '6e', stage: 'Collège' },
      { amount: '60000.00', school_year: '2025-2026', class: '6e', stage: 'Collège' },
    ],
  }
  const [fees] = buildFeeComparison([school])

  assert.deepEqual(fees.classFees, [{ className: '6e', stage: 'Collège', amount: 70000 }])
})

test('fee bars are measured against the most expensive school compared', () => {
  const [collegeFees, universityFees] = buildFeeComparison([COLLEGE, UNIVERSITY])

  assert.equal(universityFees.highestShare, 100)
  assert.equal(collegeFees.highestShare, 50)
  assert.equal(collegeFees.lowestShare, 39)
})

test('a school without fees has no entry, never an invented amount', () => {
  const fees = buildFeeComparison([{ ...UNIVERSITY, fees: [] }, COLLEGE])

  assert.equal(fees[0], null)
  assert.equal(fees[1].highestShare, 100)
})

test('an exam block shows the latest session of each school', () => {
  const [bepcBlock] = buildExamComparison([COLLEGE, UNIVERSITY])

  assert.equal(bepcBlock.exam, 'BEPC')
  assert.deepEqual(bepcBlock.entries[0], {
    status: EXAM_STATUS.published,
    passRate: 72.5,
    session: '2025',
  })
})

test('an exam that the school type does not sit is not applicable, not hidden', () => {
  const examAllowedTypes = { BEPC: ['Secondary general', 'Secondary technical'] }
  const [bepcBlock] = buildExamComparison([COLLEGE, UNIVERSITY], examAllowedTypes)

  assert.deepEqual(bepcBlock.entries[1], { status: EXAM_STATUS.notApplicable })
})

test('a school of the right type without a result is simply not published', () => {
  const silentCollege = { ...COLLEGE, exam_results: [] }
  const [bepcBlock] = buildExamComparison([COLLEGE, silentCollege], { BEPC: ['Secondary general'] })

  assert.deepEqual(bepcBlock.entries[1], { status: EXAM_STATUS.notPublished })
})

test('an exam missing from the rules is never declared not applicable', () => {
  const [bepcBlock] = buildExamComparison([COLLEGE, UNIVERSITY], {})

  assert.deepEqual(bepcBlock.entries[1], { status: EXAM_STATUS.notPublished })
})

test('there is no exam block when no school sits an exam', () => {
  assert.deepEqual(buildExamComparison([UNIVERSITY]), [])
})

test('shared items are those every school lists', () => {
  assert.deepEqual(
    findSharedItems([['Library', 'Canteen'], ['Library', 'Boarding'], ['Library']]),
    ['Library'],
  )
})

test('a single school shares nothing with anyone', () => {
  assert.deepEqual(findSharedItems([['Library']]), [])
})

test('contact details become links, and an unsafe website gets none', () => {
  const school = { phone: '699000000', contact_email: 'info@school.cm', website: 'www.school.cm' }

  assert.deepEqual(buildContactLinks(school), {
    phoneHref: 'tel:699000000',
    emailHref: 'mailto:info@school.cm',
    websiteHref: 'https://www.school.cm',
  })
  assert.deepEqual(buildContactLinks({ ...COLLEGE, website: 'javascript:alert(1)' }), {
    phoneHref: 'tel:699000000',
    emailHref: null,
    websiteHref: null,
  })
})

test('the cover is the first image, and a school without media has none', () => {
  const media = [{ type: 'video', url: '/media/a.mp4' }, { type: 'image', url: '/media/b.jpg' }]

  assert.equal(findCoverUrl({ media }), '/media/b.jpg')
  assert.equal(findCoverUrl({}), null)
})

test('key figures are the lowest current fee and the best latest pass rate', () => {
  const school = {
    ...COLLEGE,
    exam_results: [...COLLEGE.exam_results, { exam: 'Probatoire', session: '2025', pass_rate: '81.00' }],
  }

  assert.deepEqual(buildKeyFigures(school), { lowestFee: 70000, bestPassRate: 81 })
  assert.deepEqual(buildKeyFigures({ fees: [], exam_results: [] }), {
    lowestFee: null,
    bestPassRate: null,
  })
})
