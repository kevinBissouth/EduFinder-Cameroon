import { useTranslation } from 'react-i18next'

import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import { formatPercent } from '../../utils/format'

const CHART_WIDTH = 640
const CHART_HEIGHT = 280
const MARGIN = { top: 12, right: 16, bottom: 32, left: 40 }
const PLOT_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right
const PLOT_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom
const GRADUATION_COUNT = 4
const RATE_STEP = 10
// Plage minimale de l'axe des taux, pour qu'une série presque plate ne
// paraisse pas varier fortement.
const MINIMUM_RATE_SPAN = 20
// Une couleur par examen, dans l'ordre des couleurs de graphique du thème.
const SERIES_STYLES = [
  { stroke: 'stroke-primary', fill: 'fill-primary', dot: 'bg-primary' },
  { stroke: 'stroke-violet', fill: 'fill-violet', dot: 'bg-violet' },
  { stroke: 'stroke-accent', fill: 'fill-accent', dot: 'bg-accent' },
  { stroke: 'stroke-primary-deep', fill: 'fill-primary-deep', dot: 'bg-primary-deep' },
  { stroke: 'stroke-ink-soft', fill: 'fill-ink-soft', dot: 'bg-ink-soft' },
]

function listSessions(examResults) {
  return [...new Set(examResults.map((examResult) => examResult.session))].sort(
    (firstSession, secondSession) => Number(firstSession) - Number(secondSession),
  )
}

// L'axe des taux se cale sur la plage réelle des données, arrondie à la
// dizaine : sur une échelle fixe de 0 à 100, des taux voisins se superposent.
function buildRateScale(examResults) {
  const rates = examResults.map((examResult) => Number(examResult.pass_rate))
  let lowestRate = Math.floor(Math.min(...rates) / RATE_STEP) * RATE_STEP
  let highestRate = Math.ceil(Math.max(...rates) / RATE_STEP) * RATE_STEP
  if (highestRate - lowestRate < MINIMUM_RATE_SPAN) {
    highestRate = Math.min(100, lowestRate + MINIMUM_RATE_SPAN)
    lowestRate = highestRate - MINIMUM_RATE_SPAN
  }
  const graduationStep = (highestRate - lowestRate) / GRADUATION_COUNT
  return {
    lowestRate,
    highestRate,
    graduations: Array.from(
      { length: GRADUATION_COUNT + 1 },
      (_, index) => lowestRate + index * graduationStep,
    ),
  }
}

// Une série par examen, ses points rangés par session croissante.
function buildSeries(examResults, sessions) {
  const exams = [...new Set(examResults.map((examResult) => examResult.exam))]
  return exams.map((exam, index) => ({
    exam,
    style: SERIES_STYLES[index % SERIES_STYLES.length],
    points: examResults
      .filter((examResult) => examResult.exam === exam)
      .map((examResult) => ({
        session: examResult.session,
        rate: Number(examResult.pass_rate),
        sessionIndex: sessions.indexOf(examResult.session),
      }))
      .sort((firstPoint, secondPoint) => firstPoint.sessionIndex - secondPoint.sessionIndex),
  }))
}

function ChartGrid({ sessions, graduations, xOfSession, yOfRate }) {
  return (
    <>
      {graduations.map((rate) => (
        <g key={rate}>
          <line
            x1={MARGIN.left}
            x2={CHART_WIDTH - MARGIN.right}
            y1={yOfRate(rate)}
            y2={yOfRate(rate)}
            className="stroke-line"
          />
          <text x={MARGIN.left - 8} y={yOfRate(rate)} textAnchor="end" dominantBaseline="middle" className="fill-ink-soft text-xs">
            {formatPercent(rate)}
          </text>
        </g>
      ))}
      {sessions.map((session, sessionIndex) => (
        <text key={session} x={xOfSession(sessionIndex)} y={CHART_HEIGHT - 8} textAnchor="middle" className="fill-ink-soft text-xs">
          {session}
        </text>
      ))}
    </>
  )
}

function SeriesLine({ series, xOfSession, yOfRate }) {
  const { t } = useTranslation('profile')
  const translateReference = useReferenceLabel()
  const linePoints = series.points
    .map((point) => `${xOfSession(point.sessionIndex)},${yOfRate(point.rate)}`)
    .join(' ')

  return (
    <g>
      <polyline points={linePoints} fill="none" strokeWidth="2" strokeLinejoin="round" className={series.style.stroke} />
      {series.points.map((point) => (
        <circle key={point.session} cx={xOfSession(point.sessionIndex)} cy={yOfRate(point.rate)} r="3.5" className={`${series.style.fill} stroke-surface`} strokeWidth="1.5">
          <title>
            {t('results.pointTitle', {
              exam: translateReference('exams', series.exam),
              session: point.session,
              rate: formatPercent(point.rate),
            })}
          </title>
        </circle>
      ))}
    </g>
  )
}

// Évolution des taux de réussite, session après session, une courbe par
// examen. La légende nomme chaque courbe : l'information ne repose pas sur la
// seule couleur.
function ExamResultsChart({ examResults = [] }) {
  const { t } = useTranslation('profile')
  const translateReference = useReferenceLabel()
  const sessions = listSessions(examResults)
  if (sessions.length === 0) return null

  const series = buildSeries(examResults, sessions)
  const xOfSession = (sessionIndex) =>
    MARGIN.left + (sessions.length === 1 ? PLOT_WIDTH / 2 : (PLOT_WIDTH * sessionIndex) / (sessions.length - 1))
  const rateScale = buildRateScale(examResults)
  const yOfRate = (rate) =>
    MARGIN.top +
    PLOT_HEIGHT * (1 - (rate - rateScale.lowestRate) / (rateScale.highestRate - rateScale.lowestRate))

  return (
    <figure>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={t('results.chartLabel')} className="w-full">
        <ChartGrid
          sessions={sessions}
          graduations={rateScale.graduations}
          xOfSession={xOfSession}
          yOfRate={yOfRate}
        />
        {series.map((examSeries) => (
          <SeriesLine key={examSeries.exam} series={examSeries} xOfSession={xOfSession} yOfRate={yOfRate} />
        ))}
      </svg>
      <figcaption>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {series.map((examSeries) => (
            <li key={examSeries.exam} className="flex items-center gap-2 text-sm text-ink">
              <span aria-hidden="true" className={`size-2.5 rounded-full ${examSeries.style.dot}`} />
              {translateReference('exams', examSeries.exam)}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}

export default ExamResultsChart
