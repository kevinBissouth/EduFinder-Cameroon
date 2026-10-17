import { useTranslation } from 'react-i18next'

import Button from '../ui/Button'

// Pied des fenêtres qui concernent une école : fermer, ou aller à sa fiche.
// Sur téléphone, l'action principale est en haut, à portée du pouce.
function SchoolWindowFooter({ school, onOpenSchool, onClose }) {
  const { t } = useTranslation('manager')

  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="secondary" onClick={onClose}>
        {t('actions.close')}
      </Button>
      {school && (
        <Button onClick={() => onOpenSchool(school.establishment_uuid)}>
          {t('actions.openSchoolDetails')}
        </Button>
      )}
    </div>
  )
}

export default SchoolWindowFooter
