import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { describeBudget } from './budgetLabels'
import OptionRow from './OptionRow'
import Button from '../ui/Button'
import { AmountField } from '../ui/Field'
import Modal from '../ui/Modal'

// Fourchettes courantes des frais annuels au Cameroun, du public au
// supérieur privé : un appui remplit les deux champs, qu'on peut ensuite
// ajuster à la main.
const BUDGET_PRESETS = [
  { minimum: '', maximum: '50000' },
  { minimum: '50000', maximum: '150000' },
  { minimum: '150000', maximum: '500000' },
  { minimum: '500000', maximum: '' },
]

function BudgetPresets({ minimumFee, maximumFee, onPick }) {
  const { t } = useTranslation('home')

  return (
    <ul role="radiogroup" aria-label={t('filters.yearlyBudget')} className="grid gap-2">
      {BUDGET_PRESETS.map((preset) => (
        <OptionRow
          key={`${preset.minimum}-${preset.maximum}`}
          role="radio"
          name={describeBudget(preset.minimum, preset.maximum, t)}
          isSelected={preset.minimum === minimumFee && preset.maximum === maximumFee}
          onSelect={() => onPick(preset)}
        />
      ))}
    </ul>
  )
}

function BudgetDialog({ icon, minFee, maxFee, onApply, onClose }) {
  const { t } = useTranslation('home')
  const [minimumFee, setMinimumFee] = useState(minFee || '')
  const [maximumFee, setMaximumFee] = useState(maxFee || '')
  const applyAndClose = (minimum, maximum) => {
    onApply(minimum, maximum)
    onClose()
  }
  const pickPreset = (preset) => {
    setMinimumFee(preset.minimum)
    setMaximumFee(preset.maximum)
  }

  return (
    <Modal
      icon={icon}
      title={t('filters.yearlyBudget')}
      description={t('filters.budgetHint')}
      size="md"
      onClose={onClose}
      footer={
        <div className="flex justify-between gap-2">
          <Button variant="ghost" onClick={() => applyAndClose('', '')}>
            {t('filters.clear')}
          </Button>
          <Button onClick={() => applyAndClose(minimumFee, maximumFee)}>{t('filters.apply')}</Button>
        </div>
      }
    >
      <BudgetPresets minimumFee={minimumFee} maximumFee={maximumFee} onPick={pickPreset} />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AmountField
          label={t('filters.minimumPerYear')}
          value={minimumFee}
          onChange={setMinimumFee}
          placeholder="0"
        />
        <AmountField
          label={t('filters.maximumPerYear')}
          value={maximumFee}
          onChange={setMaximumFee}
          placeholder={t('filters.noLimit')}
        />
      </div>
    </Modal>
  )
}

export default BudgetDialog
