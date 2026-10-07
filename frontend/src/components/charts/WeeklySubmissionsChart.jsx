import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'

import ChartFrame from './ChartFrame'
import ChartLegend from './ChartLegend'
import ChartTooltip from './ChartTooltip'
import { groupSubmissionsByWeek } from './chartData'
import { AXIS_TICK, CHART_COLORS, CHART_MARGIN } from './chartTheme'

const WEEK_COUNT = 12
const TOP_BAR_RADIUS = [4, 4, 0, 0]
const SERIES = [
  { dataKey: 'approved', name: 'Approved', color: CHART_COLORS.success },
  { dataKey: 'pending', name: 'Awaiting review', color: CHART_COLORS.accent },
  { dataKey: 'rejected', name: 'Rejected', color: CHART_COLORS.danger },
]

// Soumissions reçues chaque semaine, empilées par issue. Chaque barre porte
// la date du lundi de sa semaine.
function WeeklySubmissionsChart({ submissions }) {
  const weeks = groupSubmissionsByWeek(submissions, WEEK_COUNT)

  return (
    <>
      <ChartFrame>
        <BarChart data={weeks} margin={CHART_MARGIN} accessibilityLayer>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-muted)' }} />
          {SERIES.map((series, seriesIndex) => (
            <Bar
              isAnimationActive={false}
              key={series.dataKey}
              dataKey={series.dataKey}
              name={series.name}
              stackId="submissions"
              fill={series.color}
              radius={seriesIndex === SERIES.length - 1 ? TOP_BAR_RADIUS : undefined}
            />
          ))}
        </BarChart>
      </ChartFrame>
      <ChartLegend
        className="mt-4"
        items={SERIES.map((series) => ({
          label: series.name,
          color: series.color,
          value: weeks.reduce((sum, week) => sum + week[series.dataKey], 0),
        }))}
      />
    </>
  )
}

export default WeeklySubmissionsChart
