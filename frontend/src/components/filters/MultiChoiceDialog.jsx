import OptionRow from './OptionRow'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

// Fenêtre de choix multiple : on coche autant de lignes qu'on veut, chaque
// appui s'applique aussitôt, le bouton du bas ne fait que refermer. Les choix
// peuvent être rangés en rubriques (les classes par cycle) ; une rubrique sans
// titre s'affiche sans intertitre.
// sections = [{ title, options: [{ id, name }] }], selectedIds = ids en texte.
function MultiChoiceDialog({
  icon,
  title,
  description,
  sections,
  selectedIds,
  emptyMessage,
  doneLabel,
  onToggle,
  onClose,
}) {
  const hasOptions = sections.some((section) => section.options.length > 0)

  return (
    <Modal
      icon={icon}
      title={title}
      description={description}
      size="md"
      onClose={onClose}
      footer={
        <Button className="w-full" onClick={onClose}>
          {doneLabel}
        </Button>
      }
    >
      {!hasOptions && <p className="text-sm text-ink-soft">{emptyMessage}</p>}
      <div className="space-y-5">
        {sections.map((section) => (
          <section key={section.title ?? ''}>
            {section.title && (
              <h3 className="mb-2 text-sm font-semibold text-ink-soft">{section.title}</h3>
            )}
            <ul className="grid gap-2 sm:grid-cols-2">
              {section.options.map((option) => (
                <OptionRow
                  key={option.id}
                  role="checkbox"
                  name={option.name}
                  isSelected={selectedIds.includes(String(option.id))}
                  onSelect={() => onToggle(String(option.id))}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  )
}

export default MultiChoiceDialog
