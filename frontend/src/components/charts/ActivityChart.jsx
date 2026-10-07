import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'

import ChartCard from './ChartCard'
import ChartFrame from './ChartFrame'
import ChartLegend from './ChartLegend'
import ChartTooltip from './ChartTooltip'
import { formatDayLabel, sumActivity } from './chartData'
import { AXIS_TICK, CHART_COLORS, CHART_MARGIN } from './chartTheme'
import { ACTIVITY_PERIODS_IN_DAYS } from '../../hooks/useActivity'
import { formatShortDate } from '../../utils/format'

const TICK_COUNT = 6

function PeriodToggle({ periodInDays, onChange }) {
  return (
    <div role="group" aria-label="Period" className="flex rounded-full border border-line p-1">
      {ACTIVITY_PERIODS_IN_DAYS.map((period) => (
        <button
          key={period}
          type="button"
          aria-pressed={period === periodInDays}
          onClick={() => onChange(period)}
          className={`min-h-11 cursor-pointer rounded-full px-3 text-sm font-semibold transition-colors ${
            period === periodInDays ? 'bg-navy text-white' : 'text-ink hover:text-primary-deep'
          }`}
        >
          {period} days
        </button>
      ))}
    </div>
  )
}

function findChartStatus(activityState) {
  if (activityState.status !== 'ready') return activityState.status
  return activityState.activity.collected_since ? 'ready' : 'empty'
}

// Visites et demandes de contact, jour par jour. Tant que rien n'a été
// compté, le bloc le dit au lieu de tracer une courbe plate trompeuse.
function ActivityChart({ icon, tone, title, description, activityState, className }) {
  const status = findChartStatus(activityState)
  const days = activityState.activity?.days ?? []
  const totals = sumActivity(days)
  const chartRows = days.map((day) => ({ ...day, label: formatDayLabel(day.day) }))

  return (
    <ChartCard
      title={title}
      description={description}
      className={className}
      status={status}
      emptyMessage="Nothing has been counted yet. The curve starts with the first visit to the public page."
      onRetry={activityState.reload}
      icon={icon}
      tone={tone}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ChartLegend
          items={[
            { label: 'Visits', color: CHART_COLORS.primary, value: totals.views },
            { label: 'Contact requests', color: CHART_COLORS.accent, value: totals.inquiries },
          ]}
        />
        <PeriodToggle
          periodInDays={activityState.periodInDays}
          onChange={activityState.setPeriodInDays}
        />
      </div>
      <ChartFrame>
        <AreaChart data={chartRows} margin={CHART_MARGIN} accessibilityLayer>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            interval={Math.ceil(chartRows.length / TICK_COUNT)}
          />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="views"
            name="Visits"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            fill={CHART_COLORS.primary}
            fillOpacity={0.12}
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="inquiries"
            name="Contact requests"
            stroke={CHART_COLORS.accent}
            strokeWidth={2}
            fill={CHART_COLORS.accent}
            fillOpacity={0.12}
          />
        </AreaChart>
      </ChartFrame>
      {activityState.activity?.collected_since && (
        <p className="mt-3 text-xs text-ink-soft">
          Counted since {formatShortDate(activityState.activity.collected_since)}.
        </p>
      )}
    </ChartCard>
  )
}

export default ActivityChart
