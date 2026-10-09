import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from '../../ui/Button'
import { AmountField, SelectField, TextField } from '../../ui/Field'
import ToggleChipGroup from '../../workspace/ToggleChipGroup'
import { toggleValue } from '../../workspace/toggleChips'
import { createExamResultRow, createFeeRow, removeRow, replaceRow } from './proposalDraft'
import { useReferenceLabel } from '../../../hooks/useReferenceLabel'

const SEPTEMBER_MONTH_INDEX = 8
const MAX_PASS_RATE = 100
// Sans step="any", un champ numérique n'accepte que des entiers : un taux de
// 72,5 % déjà enregistré bloquerait l'étape, le navigateur refusant d'avancer.

// Au Cameroun l'année scolaire va de septembre à août : avant septembre,
// l'année en cours a commencé l'année civile précédente.
function findCurrentSchoolYear() {
  const today = new Date()
  const startYear =
    today.getMonth() >= SEPTEMBER_MONTH_INDEX ? today.getFullYear() : today.getFullYear() - 1
  return `${startYear}-${startYear + 1}`
}

function RowFrame({ removeLabel, onRemove, children }) {
  return (
    <li className="rounded-control border border-line bg-paper p-4">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-control px-2 text-sm font-semibold text-danger-deep hover:bg-danger-soft"
      >
        <Trash2 aria-hidden="true" className="size-4" />
        {removeLabel}
      </button>
    </li>
  )
}

function AddRowButton({ label, onAdd }) {
  return (
    <Button variant="secondary" onClick={onAdd} className="mt-4">
      <Plus aria-hidden="true" className="size-4" />
      {label}
    </Button>
  )
}

export function FeeRowsEditor({ feeRows, levels, paymentMethods, onChange }) {
  const { t } = useTranslation('manager')
  const translateReference = useReferenceLabel()
  const changeRow = (rowId, changes) => onChange(replaceRow(feeRows, rowId, changes))

  return (
    <>
      <ul className="space-y-3">
        {feeRows.map((feeRow) => (
          <RowFrame
            key={feeRow.rowId}
            removeLabel={t('form.rows.removeFee')}
            onRemove={() => onChange(removeRow(feeRows, feeRow.rowId))}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <SelectField
                label={t('form.rows.level')}
                placeholder={t('form.rows.chooseLevel')}
                options={levels}
                value={feeRow.id_level}
                onChange={(event) => changeRow(feeRow.rowId, { id_level: event.target.value })}
              />
              <AmountField
                label={t('form.rows.yearlyAmount')}
                value={feeRow.amount}
                onChange={(amount) => changeRow(feeRow.rowId, { amount })}
              />
              <TextField
                label={t('form.rows.schoolYear')}
                placeholder={findCurrentSchoolYear()}
                value={feeRow.school_year}
                onChange={(event) => changeRow(feeRow.rowId, { school_year: event.target.value })}
              />
            </div>
            <div className="mt-3">
              {/* Un plan déjà enregistré mais absent de la liste de référence reste proposé. */}
              <ToggleChipGroup
                label={t('fees.paymentPlans')}
                options={[...new Set([...paymentMethods, ...feeRow.payment_methods])].map(
                  (paymentMethod) => ({
                    value: paymentMethod,
                    label: translateReference('payment_methods', paymentMethod),
                  }),
                )}
                selectedValues={feeRow.payment_methods}
                onToggle={(paymentMethod) =>
                  changeRow(feeRow.rowId, {
                    payment_methods: toggleValue(feeRow.payment_methods, paymentMethod),
                  })
                }
              />
            </div>
          </RowFrame>
        ))}
      </ul>
      <AddRowButton label={t('form.rows.addFee')} onAdd={() => onChange([...feeRows, createFeeRow()])} />
    </>
  )
}

export function ExamResultRowsEditor({ examResultRows, exams, onChange }) {
  const { t } = useTranslation('manager')
  const changeRow = (rowId, changes) => onChange(replaceRow(examResultRows, rowId, changes))

  return (
    <>
      <ul className="space-y-3">
        {examResultRows.map((examResultRow) => (
          <RowFrame
            key={examResultRow.rowId}
            removeLabel={t('form.rows.removeResult')}
            onRemove={() => onChange(removeRow(examResultRows, examResultRow.rowId))}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <SelectField
                label={t('form.rows.exam')}
                placeholder={t('form.rows.chooseExam')}
                options={exams}
                value={examResultRow.id_exam}
                onChange={(event) => changeRow(examResultRow.rowId, { id_exam: event.target.value })}
              />
              <TextField
                label={t('form.rows.session')}
                placeholder={String(new Date().getFullYear())}
                value={examResultRow.session}
                onChange={(event) => changeRow(examResultRow.rowId, { session: event.target.value })}
              />
              <TextField
                label={t('form.rows.passRate')}
                type="number"
                min="0"
                max={MAX_PASS_RATE}
                step="any"
                value={examResultRow.pass_rate}
                onChange={(event) =>
                  changeRow(examResultRow.rowId, { pass_rate: event.target.value })
                }
              />
            </div>
          </RowFrame>
        ))}
      </ul>
      <AddRowButton
        label={t('form.rows.addResult')}
        onAdd={() => onChange([...examResultRows, createExamResultRow()])}
      />
    </>
  )
}
