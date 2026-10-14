import { CalendarDays, ClipboardCheck, ListPlus, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from '../../ui/Button'
import ChoiceField from '../../ui/ChoiceField'
import { TextField } from '../../ui/Field'
import {
  createSessionRows,
  findExamIdsToPrefill,
  findLatestEnteredSession,
  listSessionChoices,
  listSessionsWithErrors,
  listTakenExamIds,
} from './examSessions'
import { listRowOptions } from './offeredChoices'
import { removeRow, replaceRow } from './proposalDraft'

const MAX_PASS_RATE = 100
// Sans step="any", un champ numérique n'accepte que des entiers : un taux de
// 72,5 % déjà enregistré bloquerait l'étape, le navigateur refusant d'avancer.

// Une ligne tient en peu de hauteur : avec cinq examens par session, chaque
// ligne gagnée évite un défilement sur téléphone. Sur téléphone, la tuile de
// l'examen prend la largeur, puis le taux et la corbeille se partagent la
// ligne suivante. Au-delà, tout tient sur une ligne et la tuile reçoit la plus
// grande part : son texte (« Choisir un examen ») doit tenir sur une ligne,
// alors qu'un taux n'a besoin que de quelques caractères. Chaque champ occupe
// trois rangées (libellé, saisie, erreur) partagées avec ses voisins, ce qui
// aligne toutes les saisies.
const ROW_GRID_CLASSES =
  'grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 rounded-control border border-line bg-paper p-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] sm:p-4'
const WIDE_FIELD_CLASSES = 'col-span-2 sm:col-span-1'
// La corbeille se place dans la rangée « saisie » : la 5e sur téléphone, sous
// les trois rangées de la tuile, la 2e quand tout tient sur une ligne.
const REMOVE_BUTTON_PLACEMENT_CLASSES = 'col-start-2 row-start-5 sm:col-start-3 sm:row-start-2'
const EXAM_RESULT_FIELD_NAMES = ['id_exam', 'session', 'pass_rate']

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

function ExamResultRow({ examResultRow, examOptions, errorFor, onChange, onRemove }) {
  const { t } = useTranslation('manager')

  return (
    <li className={ROW_GRID_CLASSES}>
      <ChoiceField
        isGridAligned
        className={WIDE_FIELD_CLASSES}
        icon={ClipboardCheck}
        label={t('form.rows.exam')}
        placeholder={t('form.rows.chooseExam')}
        options={examOptions}
        error={errorFor(examResultRow.rowId, 'id_exam')}
        value={examResultRow.id_exam}
        onChange={(examId) => onChange({ id_exam: examId })}
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
        onChange={(event) => onChange({ pass_rate: event.target.value })}
      />
      <RemoveRowButton label={t('form.rows.removeResult')} onRemove={onRemove} />
    </li>
  )
}

// Une session vide s'ouvre avec les examens de la dernière session saisie,
// comme les frais d'une année repartent de ceux de l'année précédente.
function NewSessionPrompt({ session, previousSession, onPrefill }) {
  const { t } = useTranslation('manager')
  const textKeys = previousSession
    ? { hint: 'form.examSessions.prefillHint', action: 'form.examSessions.prefill' }
    : {
        hint: 'form.examSessions.prefillHintWithoutHistory',
        action: 'form.examSessions.prefillWithoutHistory',
      }

  return (
    <div className="rounded-control border border-line bg-paper p-4">
      <p className="text-sm text-ink-soft">{t(textKeys.hint, { session, previousSession })}</p>
      <Button variant="secondary" onClick={onPrefill} className="mt-3">
        <ListPlus aria-hidden="true" className="size-4" />
        {t(textKeys.action, { previousSession })}
      </Button>
    </div>
  )
}

function OtherSessionErrors({ sessions, onShowSession }) {
  const { t } = useTranslation('manager')

  return (
    <div role="alert" className="rounded-control border border-danger bg-danger-soft p-4">
      <p className="text-sm font-semibold text-danger-deep">{t('form.examSessions.otherSessionErrors')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {sessions.map((session) => (
          <Button key={session} variant="secondary" onClick={() => onShowSession(session)}>
            {t('form.examSessions.showSession', { session })}
          </Button>
        ))}
      </div>
    </div>
  )
}

function countEnteredResults(examResultRows, session) {
  return examResultRows.filter(
    (examResultRow) => examResultRow.session === session && examResultRow.pass_rate !== '',
  ).length
}

// Résultats d'une session à la fois : la session se choisit en haut, la plus
// récente d'abord, et chaque ligne ne demande que l'examen et son taux.
// session est la session choisie, vide tant que le responsable n'en a pas
// choisi : c'est alors la plus récente.
export function ExamResultsEditor({
  examResultRows,
  session,
  latestSession,
  exams,
  offeredExamIds,
  errorFor,
  onChangeRows,
  onChangeSession,
}) {
  const { t } = useTranslation('manager')
  const sessionChoices = listSessionChoices(examResultRows, latestSession)
  const displayedSession = session || sessionChoices[0] || ''
  const sessionRows = examResultRows.filter(
    (examResultRow) => examResultRow.session === displayedSession,
  )
  const examIdsToPrefill = findExamIdsToPrefill(examResultRows, exams, offeredExamIds)
  const hasRowError = (examResultRow) =>
    EXAM_RESULT_FIELD_NAMES.some((fieldName) => errorFor(examResultRow.rowId, fieldName))
  const otherSessionsWithErrors = listSessionsWithErrors(examResultRows, hasRowError).filter(
    (sessionWithErrors) => sessionWithErrors !== displayedSession,
  )

  const changeRow = (rowId, changes) => onChangeRows(replaceRow(examResultRows, rowId, changes))
  // Un résultat publié jeté à la corbeille devient une demande de retrait :
  // je le fais confirmer, comme le retrait d'un fichier de la galerie.
  const removeExamResultRow = (examResultRow) => {
    if (examResultRow.isPublished && !window.confirm(t('form.examSessions.confirmRemoval'))) {
      return
    }
    onChangeRows(removeRow(examResultRows, examResultRow.rowId))
  }
  const examOptionsFor = (examResultRow) => {
    const takenExamIds = listTakenExamIds(examResultRows, examResultRow)
    return listRowOptions(exams, offeredExamIds, examResultRow.id_exam).filter(
      (exam) => !takenExamIds.includes(String(exam.id)),
    )
  }
  const sessionOptions = sessionChoices.map((sessionChoice) => {
    const count = countEnteredResults(examResultRows, sessionChoice)
    const name = count
      ? t('form.examSessions.sessionOption', { session: sessionChoice, count })
      : t('form.examSessions.emptySessionOption', { session: sessionChoice })
    return { id: sessionChoice, name }
  })

  return (
    <>
      <ChoiceField
        icon={CalendarDays}
        label={t('form.rows.session')}
        placeholder={t('form.choose')}
        options={sessionOptions}
        value={displayedSession}
        isClearable={false}
        onChange={onChangeSession}
      />

      {otherSessionsWithErrors.length > 0 && (
        <OtherSessionErrors sessions={otherSessionsWithErrors} onShowSession={onChangeSession} />
      )}

      {sessionRows.length === 0 && examIdsToPrefill.length > 0 && (
        <NewSessionPrompt
          session={displayedSession}
          previousSession={findLatestEnteredSession(examResultRows)}
          onPrefill={() =>
            onChangeRows([
              ...examResultRows,
              ...createSessionRows(examIdsToPrefill, displayedSession),
            ])
          }
        />
      )}

      <ul className="space-y-3">
        {sessionRows.map((examResultRow) => (
          <ExamResultRow
            key={examResultRow.rowId}
            examResultRow={examResultRow}
            examOptions={examOptionsFor(examResultRow)}
            errorFor={errorFor}
            onChange={(changes) => changeRow(examResultRow.rowId, changes)}
            onRemove={() => removeExamResultRow(examResultRow)}
          />
        ))}
      </ul>
      {sessionRows.length > 0 && (
        <p className="text-sm text-ink-soft">{t('form.examSessions.blankRateHint')}</p>
      )}
      <AddRowButton
        label={t('form.examSessions.addExam')}
        onAdd={() => onChangeRows([...examResultRows, ...createSessionRows([''], displayedSession)])}
      />
    </>
  )
}
