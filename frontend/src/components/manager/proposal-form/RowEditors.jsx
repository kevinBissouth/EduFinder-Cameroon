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
// ligne gagnée évite un long défilement sur téléphone. Sur téléphone, la tuile
// de choix prend la largeur, puis les deux champs courts et la corbeille se
// partagent la ligne suivante. Au-delà, tout tient sur une ligne et la tuile
// reçoit la plus grande part : son texte (« Choisir un examen ») doit tenir
// sur une ligne, alors qu'une année ou un taux n'ont besoin que de quelques
// caractères. Chaque champ occupe trois rangées (libellé, saisie, erreur)
// partagées avec ses voisins, ce qui aligne toutes les saisies.
const ROW_GRID_CLASSES =
  'grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 rounded-control border border-line bg-paper p-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:p-4'
const WIDE_FIELD_CLASSES = 'col-span-3 sm:col-span-1'
// La corbeille se place dans la rangée « saisie » : la 5e sur téléphone, sous
// les trois rangées de la tuile, la 2e quand tout tient sur une ligne.
const REMOVE_BUTTON_PLACEMENT_CLASSES = 'col-start-3 row-start-5 sm:col-start-4 sm:row-start-2'

// La suppression est une icône, son nom reste lisible par les lecteurs
// d'écran et au survol.
function RemoveRowButton({ label, onRemove }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onRemove}
      className={`flex size-11 cursor-pointer items-center justify-center self-start rounded-control text-danger-deep hover:bg-danger-soft ${REMOVE_BUTTON_PLACEMENT_CLASSES}`}
    >
      <Trash2 aria-hidden="true" className="size-4" />
    </button>
  )
}

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
          <li key={examResultRow.rowId} className={ROW_GRID_CLASSES}>
            <ChoiceField
              isGridAligned
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
              isGridAligned
              label={t('form.rows.session')}
              placeholder={String(new Date().getFullYear())}
              error={errorFor(examResultRow.rowId, 'session')}
              value={examResultRow.session}
              onChange={(event) => changeRow(examResultRow.rowId, { session: event.target.value })}
            />
            <TextField
              isGridAligned
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
            <RemoveRowButton
              label={t('form.rows.removeResult')}
              onRemove={() => onChange(removeRow(examResultRows, examResultRow.rowId))}
            />
          </li>
        ))}
      </ul>
      <AddRowButton
        label={t('form.rows.addResult')}
        onAdd={() => onChange([...examResultRows, createExamResultRow()])}
      />
    </>
  )
}
