// Infobulle commune : libellé de l'abscisse puis une ligne par série.
function ChartTooltip({ active, payload, label, formatValue = String }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-control bg-navy px-3 py-2 text-sm text-white shadow-raised">
      <p className="font-semibold">{label}</p>
      <ul className="mt-1 space-y-0.5">
        {payload.map((series) => (
          <li key={series.dataKey} className="flex items-center gap-2 text-on-navy-soft">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {series.name}: <span className="font-semibold text-white">{formatValue(series.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ChartTooltip
