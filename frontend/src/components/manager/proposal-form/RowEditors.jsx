import { Plus, Trash2 } from 'lucide-react'

import Button from '../../ui/Button'
import { SelectField, TextField } from '../../ui/Field'
import ToggleChipGroup from '../../workspace/ToggleChipGroup'
import { toChipOptions, toggleValue } from '../../workspace/toggleChips'
import { createExamResultRow, createFeeRow, removeRow, replaceRow } from './proposalDraft'

const SEPTEMBER_MONTH_INDEX = 8
const MAX_PASS_RATE = 100

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
  const changeRow = (rowId, changes) => onChange(replaceRow(feeRows, rowId, changes))

  return (
    <>
      <ul className="space-y-3">
        {feeRows.map((feeRow) => (
          <RowFrame
            key={feeRow.rowId}
            removeLabel="Remove this fee"
            onRemove={() => onChange(removeRow(feeRows, feeRow.rowId))}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <SelectField
                label="Level"
                placeholder="Choose a level"
                options={levels}
                value={feeRow.id_level}
                onChange={(event) => changeRow(feeRow.rowId, { id_level: event.target.value })}
              />
              <TextField
                label="Yearly amount (FCFA)"
                type="number"
                min="1"
                value={feeRow.amount}
                onChange={(event) => changeRow(feeRow.rowId, { amount: event.target.value })}
              />
              <TextField
                label="School year"
                placeholder={findCurrentSchoolYear()}
                value={feeRow.school_year}
                onChange={(event) => changeRow(feeRow.rowId, { school_year: event.target.value })}
              />
            </div>
            <div className="mt-3">
              {/* Un plan déjà enregistré mais absent de la liste de référence reste proposé. */}
              <ToggleChipGroup
                label="Payment plans"
                options={toChipOptions([...new Set([...paymentMethods, ...feeRow.payment_methods])])}
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
      <AddRowButton label="Add a fee" onAdd={() => onChange([...feeRows, createFeeRow()])} />
    </>
  )
}

export function ExamResultRowsEditor({ examResultRows, exams, onChange }) {
  const changeRow = (rowId, changes) => onChange(replaceRow(examResultRows, rowId, changes))

  return (
    <>
      <ul className="space-y-3">
        {examResultRows.map((examResultRow) => (
          <RowFrame
            key={examResultRow.rowId}
            removeLabel="Remove this result"
            onRemove={() => onChange(removeRow(examResultRows, examResultRow.rowId))}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <SelectField
                label="Exam"
                placeholder="Choose an exam"
                options={exams}
                value={examResultRow.id_exam}
                onChange={(event) => changeRow(examResultRow.rowId, { id_exam: event.target.value })}
              />
              <TextField
                label="Session"
                placeholder={String(new Date().getFullYear())}
                value={examResultRow.session}
                onChange={(event) => changeRow(examResultRow.rowId, { session: event.target.value })}
              />
              <TextField
                label="Pass rate (%)"
                type="number"
                min="0"
                max={MAX_PASS_RATE}
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
        label="Add a result"
        onAdd={() => onChange([...examResultRows, createExamResultRow()])}
      />
    </>
  )
}
