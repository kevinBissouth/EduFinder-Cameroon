import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Choix de l'établissement piloté, pour un responsable qui en gère plusieurs.
// Toutes les vues liées à un établissement suivent ce choix.
function SchoolSelect({ establishments, selectedUuid, onSelectSchool, className = '' }) {
  const { t } = useTranslation('manager')
  if (establishments.length < 2) return null

  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{t('page.school')}</span>
      <select
        value={selectedUuid ?? ''}
        onChange={(event) => onSelectSchool(event.target.value)}
        className="h-11 w-full cursor-pointer appearance-none rounded-full border border-line bg-surface pl-4 pr-10 text-sm font-semibold text-navy transition-colors hover:border-primary"
      >
        {establishments.map((school) => (
          <option key={school.establishment_uuid} value={school.establishment_uuid}>
            {school.name}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
      />
    </label>
  )
}

export default SchoolSelect
