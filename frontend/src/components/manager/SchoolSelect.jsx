import { useState } from 'react'
import { Building2, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import ChoiceDialog from '../filters/ChoiceDialog'

// Choix de l'établissement piloté, pour un responsable qui en gère plusieurs.
// Toutes les vues liées à un établissement suivent ce choix. Le bouton ouvre
// la même fenêtre de choix que les critères de recherche.
function SchoolSelect({ establishments, selectedUuid, onSelectSchool, className = '' }) {
  const { t } = useTranslation('manager')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  if (establishments.length < 2) return null

  const schoolOptions = establishments.map((school) => ({
    id: school.establishment_uuid,
    name: school.name,
  }))
  const selectedSchool = schoolOptions.find((school) => school.id === selectedUuid)

  return (
    <div className={className}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={t('page.schoolChoice', { school: selectedSchool?.name ?? '' })}
        onClick={() => setIsDialogOpen(true)}
        className="flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-full border border-line bg-surface pl-4 pr-3 text-left text-sm font-semibold text-navy transition-colors hover:border-primary"
      >
        <span className="min-w-0 truncate">{selectedSchool?.name}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
      </button>
      {isDialogOpen && (
        <ChoiceDialog
          icon={Building2}
          title={t('page.school')}
          options={schoolOptions}
          selectedId={selectedUuid}
          onSelect={onSelectSchool}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  )
}

export default SchoolSelect
