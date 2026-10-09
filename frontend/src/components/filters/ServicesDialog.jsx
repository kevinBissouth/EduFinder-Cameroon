import { useTranslation } from 'react-i18next'

import OptionRow from './OptionRow'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

// Les services se cochent à volonté : chaque appui filtre aussitôt la liste,
// le bouton du bas ne fait que refermer la fenêtre.
function ServicesDialog({ icon, services, selectedNames, onToggle, onClose }) {
  const { t } = useTranslation('home')

  return (
    <Modal
      icon={icon}
      title={t('filters.services')}
      description={t('filters.servicesHint')}
      size="md"
      onClose={onClose}
      footer={
        <Button className="w-full" onClick={onClose}>
          {t('filters.done')}
        </Button>
      }
    >
      {services.length === 0 && <p className="text-sm text-ink-soft">{t('filters.noService')}</p>}
      <ul className="grid gap-2 sm:grid-cols-2">
        {services.map((serviceName) => (
          <OptionRow
            key={serviceName}
            role="checkbox"
            name={serviceName}
            isSelected={selectedNames.includes(serviceName)}
            onSelect={() => onToggle(serviceName)}
          />
        ))}
      </ul>
    </Modal>
  )
}

export default ServicesDialog
