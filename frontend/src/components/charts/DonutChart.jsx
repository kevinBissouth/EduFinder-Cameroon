import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import ChartLegend from './ChartLegend'
import ChartTooltip from './ChartTooltip'

const INNER_RADIUS = '62%'
const OUTER_RADIUS = '100%'
const SEGMENT_GAP_ANGLE = 2

// Anneau de répartition, avec le total au centre. La légende en dessous
// répète chaque nombre : l'anneau n'est jamais la seule source.
function DonutChart({ segments, totalLabel }) {
  const shownSegments = segments.filter((segment) => segment.value > 0)
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)

  return (
    <>
      <div className="relative min-h-40 flex-1">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative aspect-square h-full max-w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart accessibilityLayer>
                <Tooltip content={<ChartTooltip />} />
                <Pie
                  isAnimationActive={false}
                  data={shownSegments}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={INNER_RADIUS}
                  outerRadius={OUTER_RADIUS}
                  paddingAngle={shownSegments.length > 1 ? SEGMENT_GAP_ANGLE : 0}
                  stroke="none"
                >
                  {shownSegments.map((segment) => (
                    <Cell key={segment.label} fill={segment.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-4xl leading-display text-navy tabular-nums">
                {total}
              </span>
              <span className="text-xs text-ink-soft">{totalLabel}</span>
            </div>
          </div>
        </div>
      </div>
      <ChartLegend items={segments} className="mt-4 justify-center" />
    </>
  )
}

export default DonutChart
