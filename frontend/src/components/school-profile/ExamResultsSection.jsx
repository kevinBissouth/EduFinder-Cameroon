import { Trans, useTranslation } from 'react-i18next'

import ExamResultsChart from './ExamResultsChart'
import Container from '../ui/Container'
import SectionHeading, { Emphasis } from '../ui/SectionHeading'
import { listLatestExamResults } from './helpers'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import { formatPercent } from '../../utils/format'

function LatestResultRow({ examResult }) {
  const { t } = useTranslation('profile')
  const translateReference = useReferenceLabel()
  const passRate = Number(examResult.pass_rate)

  return (
    <li className="py-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-bold text-navy">
          {translateReference('exams', examResult.exam)}{' '}
          <span className="font-normal text-ink-soft">{t('results.session', { session: examResult.session })}</span>
        </p>
        <p className="font-display text-2xl tabular-nums text-primary">{formatPercent(passRate)}</p>
      </div>
      <span aria-hidden="true" className="mt-2 block h-1.5 rounded-full bg-muted">
        <span className="block h-1.5 rounded-full bg-primary" style={{ width: `${passRate}%` }} />
      </span>
    </li>
  )
}

function ExamResultsSection({ examResults }) {
  const { t } = useTranslation('profile')
  if (examResults.length === 0) return null

  const latestResults = listLatestExamResults(examResults)

  return (
    <section id="results" className="scroll-mt-36 border-t border-line bg-paper py-16 sm:py-20">
      <Container>
        <SectionHeading
          size="md"
          eyebrow={t('results.eyebrow')}
          title={<Trans t={t} i18nKey="results.title" components={{ emphasis: <Emphasis /> }} />}
          lead={t('results.lead')}
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <ul className="divide-y divide-line border-y border-line self-start">
            {latestResults.map((examResult) => (
              <LatestResultRow key={examResult.exam} examResult={examResult} />
            ))}
          </ul>
          <div className="rounded-panel border border-line bg-surface p-5 shadow-soft sm:p-6">
            <h3 className="text-lg font-bold text-navy">{t('results.overTime')}</h3>
            <div className="mt-4">
              <ExamResultsChart examResults={examResults} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default ExamResultsSection
