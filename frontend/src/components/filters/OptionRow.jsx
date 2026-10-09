import { Check } from 'lucide-react'

// Formes du témoin : rond pour un choix unique, carré pour un choix multiple,
// comme les boutons radio et les cases à cocher que tout le monde connaît.
const INDICATOR_SHAPES = { radio: 'rounded-full', checkbox: 'rounded-md' }

export function SelectionIndicator({ role, isSelected }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-5 shrink-0 items-center justify-center border transition-colors ${INDICATOR_SHAPES[role]} ${
        isSelected ? 'border-primary bg-primary text-white' : 'border-line bg-surface'
      }`}
    >
      {isSelected && <Check className="size-3.5" />}
    </span>
  )
}

// Une ligne à toucher dans une fenêtre de filtre : une carte entière, pas un
// petit bouton, pour que le doigt ne rate pas sa cible.
function OptionRow({ role, name, isSelected, onSelect, className = '' }) {
  return (
    <li className={className}>
      <button
        type="button"
        role={role}
        aria-checked={isSelected}
        onClick={onSelect}
        className={`flex min-h-13 w-full cursor-pointer items-center gap-3 rounded-control border px-4 text-left text-base transition active:scale-[0.99] ${
          isSelected
            ? 'border-primary bg-primary-soft/60 font-bold text-primary-deep'
            : 'border-line bg-surface font-medium text-navy hover:border-primary hover:bg-muted'
        }`}
      >
        <SelectionIndicator role={role} isSelected={isSelected} />
        {name}
      </button>
    </li>
  )
}

export default OptionRow
