import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import ChoiceDialog from '../filters/ChoiceDialog'
import FilterButton from '../filters/FilterButton'

const NO_CHOICE = ''

// Champ de formulaire à choix unique : la tuile et la fenêtre de choix des
// critères de recherche, à la place d'une liste déroulante du navigateur
// (lignes larges, faciles à toucher sur téléphone). options = [{ id, name }],
// value = l'id choisi en texte, '' sans choix. La croix de la tuile efface le
// choix, sauf si le champ est déclaré non effaçable.
function ChoiceField({
  icon,
  label,
  placeholder,
  options,
  value,
  error,
  isClearable = true,
  className = '',
  onChange,
}) {
  const { t } = useTranslation('common')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const errorId = useId()
  const selectedOption = options.find((option) => String(option.id) === String(value))

  return (
    <div className={`flex w-full flex-col gap-1.5 ${className}`}>
      <FilterButton
        icon={icon}
        label={label}
        value={selectedOption?.name ?? placeholder}
        isActive={Boolean(selectedOption)}
        hasError={Boolean(error)}
        isSingleLine
        describedBy={error ? errorId : undefined}
        clearLabel={t('clearChoice', { field: label })}
        onOpen={() => setIsDialogOpen(true)}
        onClear={isClearable ? () => onChange(NO_CHOICE) : undefined}
      />
      {error && (
        <span id={errorId} className="text-sm font-medium text-danger-deep">
          {error}
        </span>
      )}
      {isDialogOpen && (
        <ChoiceDialog
          icon={icon}
          title={label}
          options={options}
          selectedId={value}
          onSelect={onChange}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  )
}

export default ChoiceField
