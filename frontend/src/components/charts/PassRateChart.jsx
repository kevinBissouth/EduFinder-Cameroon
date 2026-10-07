import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'

import ChartFrame from './ChartFrame'
import ChartLegend from './ChartLegend'
import ChartTooltip from './ChartTooltip'
import { pivotPassRates } from './chartData'
import { AXIS_TICK, CHART_COLORS, CHART_MARGIN, SERIES_COLORS } from './chartTheme'
import { formatPercent } from '../../utils/format'

const RATE_AXIS_PADDING = 5
const MAX_RATE = 100

// Taux de réussite par examen au fil des sessions. L'axe se resserre autour
// des valeurs réelles : entre 0 et 100, des taux voisins se confondraient.
function PassRateChart({ examResults }) {
  const { examNames, rows } = pivotPassRates(examResults)
  const rates = examResults.map((examResult) => Number(examResult.pass_rate))
  const rateDomain = [
    Math.max(0, Math.floor(Math.min(...rates) - RATE_AXIS_PADDING)),
    Math.min(MAX_RATE, Math.ceil(Math.max(...rates) + RATE_AXIS_PADDING)),
  ]
  const findColor = (examIndex) => SERIES_COLORS[examIndex % SERIES_COLORS.length]

  return (
    <>
      <ChartFrame>
        <LineChart data={rows} margin={CHART_MARGIN} accessibilityLayer>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="session" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis
            domain={rateDomain}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={(rate) => `${rate}%`}
          />
          <Tooltip content={<ChartTooltip formatValue={formatPercent} />} />
          {examNames.map((examName, examIndex) => (
            <Line
              isAnimationActive={false}
              key={examName}
              type="monotone"
              dataKey={examName}
              name={examName}
              stroke={findColor(examIndex)}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartFrame>
      <ChartLegend
        className="mt-4"
        items={examNames.map((examName, examIndex) => ({
          label: examName,
          color: findColor(examIndex),
        }))}
      />
    </>
  )
}

export default PassRateChart
