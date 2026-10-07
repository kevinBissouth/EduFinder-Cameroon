// Choix multiple sous forme de pastilles : chaque pastille est un bouton à
// deux états, lisible par un lecteur d'écran grâce à aria-pressed.
function ToggleChipGroup({ label, options, selectedValues, onToggle }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(option.value)}
            className={`min-h-11 cursor-pointer rounded-full border px-4 text-sm font-semibold transition-colors ${
              isSelected
                ? 'border-primary bg-primary-soft text-primary-deep'
                : 'border-line bg-surface text-ink hover:border-primary'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default ToggleChipGroup
