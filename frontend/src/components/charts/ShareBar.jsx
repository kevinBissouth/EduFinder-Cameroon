import ChartLegend from './ChartLegend'

const PERCENT = 100

// Barre unique découpée en parts : chaque segment a la largeur de sa part
// du total, et la légende donne les nombres.
function ShareBar({ segments }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)

  return (
    <>
      <div aria-hidden="true" className="flex h-3 overflow-hidden rounded-full bg-muted">
        {segments.map((segment) => (
          <span
            key={segment.label}
            style={{
              width: `${total ? (segment.value / total) * PERCENT : 0}%`,
              backgroundColor: segment.color,
            }}
          />
        ))}
      </div>
      <ChartLegend items={segments} className="mt-4" />
    </>
  )
}

export default ShareBar
