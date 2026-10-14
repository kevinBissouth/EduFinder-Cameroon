import { ClipboardCheck, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from '../../ui/Button'
import ChoiceField from '../../ui/ChoiceField'
import { TextField } from '../../ui/Field'
import { listRowOptions } from './offeredChoices'
import { createExamResultRow, removeRow, replaceRow } from './proposalDraft'

const MAX_PASS_RATE = 100
// Sans step="any", un champ numérique n'accepte que des entiers : un taux de
// 72,5 % déjà enregistré bloquerait l'étape, le navigateur refusant d'avancer.

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

// Sur téléphone, la tuile de choix prend la largeur et les deux champs courts
// se partagent la ligne suivante. Au-delà, la tuile reçoit la plus grande
// part : son texte (« Choisir un examen ») doit tenir sur une ligne, alors
// qu'un montant ou une année n'ont besoin que de quelques caractères.
const ROW_GRID_CLASSES =
  'grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]'
const WIDE_FIELD_CLASSES = 'col-span-2 sm:col-span-1'

export function AddRowButton({ label, onAdd }) {
  return (
    <Button variant="secondary" onClick={onAdd} className="mt-4">
      <Plus aria-hidden="true" className="size-4" />
      {label}
    </Button>
  )
}

export function ExamResultRowsEditor({ examResultRows, exams, offeredExamIds, errorFor, onChange }) {
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
              <ChoiceField
                className={WIDE_FIELD_CLASSES}
                icon={ClipboardCheck}
                label={t('form.rows.exam')}
                placeholder={t('form.rows.chooseExam')}
                options={listRowOptions(exams, offeredExamIds, examResultRow.id_exam)}
                error={errorFor(examResultRow.rowId, 'id_exam')}
                value={examResultRow.id_exam}
                onChange={(examId) => changeRow(examResultRow.rowId, { id_exam: examId })}
              />
              <TextField
                label={t('form.rows.session')}
                placeholder={String(new Date().getFullYear())}
                error={errorFor(examResultRow.rowId, 'session')}
                value={examResultRow.session}
                onChange={(event) => changeRow(examResultRow.rowId, { session: event.target.value })}
              />
              <TextField
                label={t('form.rows.passRate')}
                type="number"
                min="0"
                max={MAX_PASS_RATE}
                step="any"
                error={errorFor(examResultRow.rowId, 'pass_rate')}
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
