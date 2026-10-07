const PERCENT = 100

// Barres horizontales classées : la plus longue donne l'échelle, et chaque
// valeur est écrite en clair à droite, donc lisible sans la couleur.
function RankedBars({ rows, formatValue = String, barClass = 'bg-primary' }) {
  const highestValue = Math.max(...rows.map((row) => row.value))

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-navy">{row.label}</span>
            <span className="shrink-0 font-semibold text-navy">{formatValue(row.value)}</span>
          </div>
          <div aria-hidden="true" className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${barClass}`}
              style={{ width: `${highestValue ? (row.value / highestValue) * PERCENT : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default RankedBars
