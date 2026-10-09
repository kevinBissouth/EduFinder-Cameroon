import OptionRow from './OptionRow'
import Modal from '../ui/Modal'

const ANY_OPTION_ID = ''
// Au-delà de ce nombre, les choix se rangent sur deux colonnes dès que la
// fenêtre a la place : dix régions en une colonne obligeaient à faire défiler.
const SINGLE_COLUMN_LIMIT = 5

// Fenêtre de choix unique (section, secteur, région). Toucher une ligne
// l'applique et referme la fenêtre : pas de bouton de validation à chercher.
// La première ligne retire le critère.
function ChoiceDialog({ icon, title, description, anyLabel, options, selectedId, onSelect, onClose }) {
  const choose = (optionId) => {
    onSelect(optionId)
    onClose()
  }
  const hasManyOptions = options.length > SINGLE_COLUMN_LIMIT

  return (
    <Modal icon={icon} title={title} description={description} size="md" onClose={onClose}>
      <ul
        role="radiogroup"
        aria-label={title}
        className={`grid gap-2 ${hasManyOptions ? 'sm:grid-cols-2' : ''}`}
      >
        <OptionRow
          role="radio"
          name={anyLabel}
          isSelected={!selectedId}
          onSelect={() => choose(ANY_OPTION_ID)}
          className={hasManyOptions ? 'sm:col-span-2' : ''}
        />
        {options.map((option) => (
          <OptionRow
            key={option.id}
            role="radio"
            name={option.name}
            isSelected={String(option.id) === String(selectedId)}
            onSelect={() => choose(String(option.id))}
          />
        ))}
      </ul>
    </Modal>
  )
}

export default ChoiceDialog
