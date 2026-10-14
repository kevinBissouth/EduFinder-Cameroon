import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import FilterButton from '../filters/FilterButton'
import MultiChoiceDialog from '../filters/MultiChoiceDialog'

const NAME_SEPARATOR = ', '

function findSelectedNames(sections, selectedIds) {
  return sections
    .flatMap((section) => section.options)
    .filter((option) => selectedIds.includes(String(option.id)))
    .map((option) => option.name)
}

// Champ de formulaire à choix multiple : la tuile résume ce qui est coché, la
// fenêtre permet de cocher. Même tuile et mêmes lignes que les critères de
// recherche. La croix de la tuile décoche tout. Par défaut la tuile liste les
// noms cochés et les compte ; selectionSummary remplace ce résumé quand
// l'appelant affiche lui-même le détail.
function MultiChoiceField({
  icon,
  label,
  placeholder,
  dialogDescription,
  emptyMessage,
  selectionSummary,
  sections,
  selectedIds,
  error,
  className = '',
  onChange,
}) {
  const { t } = useTranslation('common')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const errorId = useId()
  const selectedNames = findSelectedNames(sections, selectedIds)
  const hasSelection = selectedNames.length > 0

  const toggle = (optionId) =>
    onChange(
      selectedIds.includes(optionId)
        ? selectedIds.filter((selectedId) => selectedId !== optionId)
        : [...selectedIds, optionId],
    )

  return (
    <div className={`flex w-full flex-col gap-1.5 ${className}`}>
      <FilterButton
        icon={icon}
        label={
          hasSelection && !selectionSummary
            ? t('choiceCount', { field: label, count: selectedNames.length })
            : label
        }
        value={hasSelection ? (selectionSummary ?? selectedNames.join(NAME_SEPARATOR)) : placeholder}
        isActive={hasSelection}
        hasError={Boolean(error)}
        isSingleLine
        describedBy={error ? errorId : undefined}
        clearLabel={t('clearChoice', { field: label })}
        onOpen={() => setIsDialogOpen(true)}
        onClear={() => onChange([])}
      />
      {error && (
        <span id={errorId} className="text-sm font-medium text-danger-deep">
          {error}
        </span>
      )}
      {isDialogOpen && (
        <MultiChoiceDialog
          icon={icon}
          title={label}
          description={dialogDescription}
          sections={sections}
          selectedIds={selectedIds}
          emptyMessage={emptyMessage}
          doneLabel={t('done')}
          onToggle={toggle}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  )
}

export default MultiChoiceField
