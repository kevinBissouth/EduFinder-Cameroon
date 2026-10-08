import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Critère actif que l'on retire d'un clic.
function RemovableChip({ label, onRemove }) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={t('removeFilter', { label })}
      className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-primary-soft px-4 text-sm font-semibold text-primary-deep transition-colors hover:bg-primary hover:text-white sm:h-9"
    >
      {label}
      <X aria-hidden="true" className="size-4" />
    </button>
  )
}

export default RemovableChip
