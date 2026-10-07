import { ChevronDown } from 'lucide-react'

import Container from '../ui/Container'
import SectionHeading, { Emphasis } from '../ui/SectionHeading'
import { groupFeesByYear } from './helpers'
import { formatFcfa } from '../../utils/format'

function answerAboutFees(institution) {
  const feesByYear = groupFeesByYear(institution.fees ?? [])
  if (feesByYear.length === 0) {
    return 'This school has not published its fees yet. Contact it directly to ask.'
  }
  const [latestYear, latestFees] = feesByYear[0]
  const amounts = latestFees.map((fee) => Number(fee.amount))
  return `For ${latestYear}, the fees listed go from ${formatFcfa(Math.min(...amounts))} to ${formatFcfa(Math.max(...amounts))} per year, depending on the class.`
}

function answerAboutExams(institution) {
  const examResults = institution.exam_results ?? []
  if (examResults.length === 0) return 'No exam result is published for this school yet.'
  const exams = [...new Set(examResults.map((examResult) => examResult.exam))]
  const latestSession = Math.max(...examResults.map((examResult) => Number(examResult.session)))
  return `It publishes pass rates for ${exams.join(', ')}. The most recent session listed is ${latestSession}.`
}

function answerAboutContact(institution) {
  const contactWays = [
    institution.phone && `call ${institution.phone}`,
    institution.contact_email && `write to ${institution.contact_email}`,
  ].filter(Boolean)
  if (contactWays.length === 0) return 'This school has not published a phone number or an e-mail yet.'
  return `You can ${contactWays.join(' or ')}.`
}

// Chaque réponse est rédigée à partir des données publiées de la fiche :
// aucune n'est écrite à la main ni inventée.
function buildQuestions(institution) {
  return [
    { question: 'How much does a year cost?', answer: answerAboutFees(institution) },
    { question: 'Which exams does the school report?', answer: answerAboutExams(institution) },
    {
      question: 'In which language are classes taught?',
      answer: `The school is listed in the ${institution.linguistic_section} section.`,
    },
    {
      question: 'Is it a public or a private school?',
      answer: `It is listed as a ${institution.sector} school, in the category "${institution.type}".`,
    },
    { question: 'How do I contact the school?', answer: answerAboutContact(institution) },
  ]
}

function QuestionsSection({ institution }) {
  return (
    <section className="border-t border-line bg-surface py-16 sm:py-20">
      <Container>
        <SectionHeading
          size="md"
          eyebrow="Questions and answers"
          title={
            <>
              Questions to <Emphasis>ask</Emphasis> before you enquire.
            </>
          }
        />
        <div className="mt-8 grid gap-x-16 border-t border-line md:grid-cols-2">
          {buildQuestions(institution).map((item) => (
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
