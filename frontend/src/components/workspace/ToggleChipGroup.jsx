const LAYOUT_CLASSES = {
  wrapped: { group: 'flex flex-wrap gap-2', chip: 'px-4 text-sm' },
  // Trois colonnes égales : les pastilles s'alignent d'une carte à l'autre au
  // lieu de passer à la ligne là où le texte le décide. Sur téléphone la
  // colonne est étroite : le texte y est un peu plus petit pour tenir sur une
  // ligne (« 2 tranches »).
  even: {
    group: 'grid grid-cols-3 gap-2',
    chip: 'whitespace-nowrap px-2 text-center text-xs sm:text-sm',
  },
}

// Choix multiple sous forme de pastilles : chaque pastille est un bouton à
// deux états, lisible par un lecteur d'écran grâce à aria-pressed.
function ToggleChipGroup({ label, options, selectedValues, isEvenlySpread = false, onToggle }) {
  const layout = isEvenlySpread ? LAYOUT_CLASSES.even : LAYOUT_CLASSES.wrapped

  return (
    <div role="group" aria-label={label} className={layout.group}>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(option.value)}
            className={`min-h-11 cursor-pointer rounded-full border font-semibold transition-colors ${layout.chip} ${
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
