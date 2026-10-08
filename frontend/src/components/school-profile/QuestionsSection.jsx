import { ChevronDown } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import Container from '../ui/Container'
import SectionHeading, { Emphasis } from '../ui/SectionHeading'
import { groupFeesByYear } from './helpers'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import { formatFcfa } from '../../utils/format'

function answerAboutFees(institution, t) {
  const feesByYear = groupFeesByYear(institution.fees ?? [])
  if (feesByYear.length === 0) return t('questions.fees.none')
  const [latestYear, latestFees] = feesByYear[0]
  const amounts = latestFees.map((fee) => Number(fee.amount))
  return t('questions.fees.answer', {
    year: latestYear,
    lowest: formatFcfa(Math.min(...amounts)),
    highest: formatFcfa(Math.max(...amounts)),
  })
}

function answerAboutExams(institution, t, translateReference) {
  const examResults = institution.exam_results ?? []
  if (examResults.length === 0) return t('questions.exams.none')
  const exams = [...new Set(examResults.map((examResult) => examResult.exam))]
  return t('questions.exams.answer', {
    exams: exams.map((exam) => translateReference('exams', exam)).join(', '),
    session: Math.max(...examResults.map((examResult) => Number(examResult.session))),
  })
}

function answerAboutContact(institution, t) {
  const contactWays = [
    institution.phone && t('questions.contact.call', { phone: institution.phone }),
    institution.contact_email && t('questions.contact.write', { email: institution.contact_email }),
  ].filter(Boolean)
  if (contactWays.length === 0) return t('questions.contact.none')
  return t('questions.contact.answer', { ways: contactWays.join(t('questions.contact.or')) })
}

// Chaque réponse est rédigée à partir des données publiées de la fiche :
// aucune n'est écrite à la main ni inventée. Section et secteur s'insèrent au
// milieu d'une phrase, d'où les minuscules.
function buildQuestions(institution, t, translateReference) {
  return [
    { question: t('questions.fees.question'), answer: answerAboutFees(institution, t) },
    {
      question: t('questions.exams.question'),
      answer: answerAboutExams(institution, t, translateReference),
    },
    {
      question: t('questions.language.question'),
      answer: t('questions.language.answer', {
        section: translateReference('sections', institution.linguistic_section).toLowerCase(),
      }),
    },
    {
      question: t('questions.sector.question'),
      answer: t('questions.sector.answer', {
        sector: translateReference('sectors', institution.sector).toLowerCase(),
        type: translateReference('types', institution.type),
      }),
    },
    { question: t('questions.contact.question'), answer: answerAboutContact(institution, t) },
  ]
}

function QuestionsSection({ institution }) {
  const { t } = useTranslation('profile')
  const translateReference = useReferenceLabel()

  return (
    <section className="border-t border-line bg-surface py-16 sm:py-20">
      <Container>
        <SectionHeading
          size="md"
          eyebrow={t('questions.eyebrow')}
          title={<Trans t={t} i18nKey="questions.title" components={{ emphasis: <Emphasis /> }} />}
        />
        <div className="mt-8 grid gap-x-16 border-t border-line md:grid-cols-2">
          {buildQuestions(institution, t, translateReference).map((item) => (
            <details key={item.question} className="group border-b border-line">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-control text-sm font-bold text-navy [&::-webkit-details-marker]:hidden">
                {item.question}
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-primary-deep transition-transform group-open:rotate-180">
                  <ChevronDown aria-hidden="true" className="size-4" />
                </span>
              </summary>
              <p className="pb-5 text-pretty text-sm text-ink">{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}

export default QuestionsSection
