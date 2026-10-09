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

// Une ligne tient en peu de hauteur : avec trente résultats d'examens, chaque
// ligne gagnée évite un long défilement sur téléphone. La suppression est une
// icône à droite, son nom reste lisible par les lecteurs d'écran et au survol.
function RowFrame({ removeLabel, onRemove, children }) {
  return (
    <li className="flex items-start gap-2 rounded-control border border-line bg-paper p-3 sm:p-4">
      <div className="min-w-0 flex-1">{children}</div>
      <button
        type="button"
        aria-label={removeLabel}
        title={removeLabel}
        onClick={onRemove}
        className="mt-6 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control text-danger-deep hover:bg-danger-soft"
      >
        <Trash2 aria-hidden="true" className="size-4" />
      </button>
    </li>
  )
}

// Sur téléphone, la liste déroulante prend la largeur et les deux champs
// courts se partagent la ligne suivante.
const ROW_GRID_CLASSES = 'grid grid-cols-2 gap-3 sm:grid-cols-3'
const WIDE_FIELD_CLASSES = 'col-span-2 sm:col-span-1'

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
            <div className={ROW_GRID_CLASSES}>
              <SelectField
                className={WIDE_FIELD_CLASSES}
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
            <div className={ROW_GRID_CLASSES}>
              <SelectField
                className={WIDE_FIELD_CLASSES}
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
