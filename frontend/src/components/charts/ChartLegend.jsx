// Légende en texte, hors du graphique : elle reste lisible sur téléphone et
// porte la valeur quand il y en a une.
function ChartLegend({ items, className = '' }) {
  return (
    <ul className={`flex flex-wrap gap-x-5 gap-y-2 ${className}`}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-sm text-ink">
          <span
            aria-hidden="true"
            className="size-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
          {item.value !== undefined && <span className="font-semibold text-navy">{item.value}</span>}
        </li>
      ))}
    </ul>
  )
}

export default ChartLegend
