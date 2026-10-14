import { CalendarDays, Copy, GraduationCap, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from '../../ui/Button'
import ChoiceField from '../../ui/ChoiceField'
import { AmountField } from '../../ui/Field'
import MultiChoiceField from '../../ui/MultiChoiceField'
import ToggleChipGroup from '../../workspace/ToggleChipGroup'
import { toggleValue } from '../../workspace/toggleChips'
import {
  copyFeeGroups,
  createFeeGroup,
  findPreviousSchoolYear,
  isBlankFeeGroup,
  listFeeGroupsOfYear,
  listTakenLevelIds,
} from './feeGroups'
import { AddRowButton } from './RowEditors'
import { useReferenceLabel } from '../../../hooks/useReferenceLabel'
import { labelLevelOptions } from '../../../utils/levelLabels'

// Les classes qu'un montant peut encore prendre : celles de l'établissement,
// moins celles qui ont déjà un autre montant cette année. Une classe déjà
// cochée ici reste listée même si elle n'est plus proposée, pour pouvoir la
// décocher.
function listSelectableLevels(levels, feeGroup, feeGroups, offeredLevelIds) {
  const takenLevelIds = listTakenLevelIds(feeGroups, feeGroup)
  return levels.filter((level) => {
    const levelId = String(level.id)
    if (takenLevelIds.includes(levelId)) return false
    return offeredLevelIds.has(levelId) || feeGroup.levelIds.includes(levelId)
  })
}

// Une rubrique par cycle, dans l'ordre où l'API donne les classes (celui de
// la scolarité).
function buildLevelSections(levels, translateStage) {
  const sectionsByStage = new Map()
  labelLevelOptions(levels, translateStage).forEach((level) => {
    const section = sectionsByStage.get(level.stage) ?? {
      title: translateStage(level.stage),
      options: [],
    }
    sectionsByStage.set(level.stage, { ...section, options: [...section.options, level] })
  })
  return [...sectionsByStage.values()]
}

function listSelectedLevels(levelSections, levelIds) {
  return levelSections
    .flatMap((section) => section.options)
    .filter((level) => levelIds.includes(String(level.id)))
}

// Une carte par montant, lue de haut en bas : son numéro et sa corbeille, le
// montant à côté des modalités de paiement, puis les classes sur toute la
// largeur avec leur liste complète en dessous.
function FeeGroupCard({
  feeGroup,
  number,
  levelSections,
  paymentMethods,
  errorFor,
  onChange,
  onRemove,
}) {
  const { t } = useTranslation('manager')
  const translateReference = useReferenceLabel()
  const selectedLevels = listSelectedLevels(levelSections, feeGroup.levelIds)
  const removeLabel = t('form.feeGroups.remove')

  return (
    <li className="rounded-control border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-navy">{t('form.feeGroups.title', { number })}</p>
        <button
          type="button"
          aria-label={removeLabel}
          title={removeLabel}
          onClick={onRemove}
          className="-mr-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control text-danger-deep hover:bg-danger-soft"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </div>

      {/* grid-cols-1 borne la colonne : sans lui, un contenu tenu sur une
          ligne élargirait la carte au-delà de l'écran du téléphone. */}
      <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AmountField
          label={t('form.rows.yearlyAmount')}
          error={errorFor(feeGroup.groupId, 'amount')}
          value={feeGroup.amount}
          onChange={(amount) => onChange({ amount })}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-navy">{t('fees.paymentPlans')}</span>
          {/* Un plan déjà enregistré mais absent de la liste de référence reste proposé. */}
          <ToggleChipGroup
            label={t('fees.paymentPlans')}
            isEvenlySpread
            options={[...new Set([...paymentMethods, ...feeGroup.payment_methods])].map(
              (paymentMethod) => ({
                value: paymentMethod,
                label: translateReference('payment_methods', paymentMethod),
              }),
            )}
            selectedValues={feeGroup.payment_methods}
            onToggle={(paymentMethod) =>
              onChange({ payment_methods: toggleValue(feeGroup.payment_methods, paymentMethod) })
            }
          />
        </div>
      </div>

      <MultiChoiceField
        className="mt-4"
        icon={GraduationCap}
        label={t('form.feeGroups.classes')}
        placeholder={t('form.feeGroups.chooseClasses')}
        dialogDescription={t('form.feeGroups.classesHint')}
        emptyMessage={t('form.feeGroups.allClassesTaken')}
        selectionSummary={t('form.feeGroups.classCount', { count: selectedLevels.length })}
        sections={levelSections}
        selectedIds={feeGroup.levelIds}
        error={errorFor(feeGroup.groupId, 'levelIds')}
        onChange={(levelIds) => onChange({ levelIds })}
      />
      {selectedLevels.length > 0 && (
        <ul aria-label={t('form.feeGroups.selectedClasses')} className="mt-3 flex flex-wrap gap-2">
          {selectedLevels.map((level) => (
            <li
              key={level.id}
              className="rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary-deep"
            >
              {level.name}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

// Frais d'une année scolaire, saisis par montant : on écrit « 50 000 » une
// fois, puis on coche les classes qui paient ce montant. L'année se choisit
// en haut parmi celles que le serveur accepte encore (l'année en cours et la
// suivante) ; une classe n'a qu'un montant par année.
function FeeGroupsEditor({
  feeGroups,
  feeYear,
  openSchoolYears,
  levels,
  offeredLevelIds,
  paymentMethods,
  errorFor,
  onChangeGroups,
  onChangeYear,
}) {
  const { t } = useTranslation('manager')
  const translateReference = useReferenceLabel()
  const translateStage = (stage) => translateReference('stages', stage)

  const yearGroups = listFeeGroupsOfYear(feeGroups, feeYear)
  const previousYear = findPreviousSchoolYear(feeYear)
  const copiedGroups = copyFeeGroups(
    listFeeGroupsOfYear(feeGroups, previousYear),
    feeYear,
    offeredLevelIds,
  )
  const canCopyPreviousYear = yearGroups.every(isBlankFeeGroup) && copiedGroups.length > 0

  const changeGroup = (groupId, changes) =>
    onChangeGroups(
      feeGroups.map((feeGroup) =>
        feeGroup.groupId === groupId ? { ...feeGroup, ...changes } : feeGroup,
      ),
    )
  // Un montant publié jeté à la corbeille devient une demande de retrait : je
  // le fais confirmer, comme le retrait d'un fichier de la galerie.
  const removeGroup = (feeGroup) => {
    if (feeGroup.isPublished && !window.confirm(t('form.feeGroups.confirmRemoval'))) return
    onChangeGroups(feeGroups.filter((otherGroup) => otherGroup.groupId !== feeGroup.groupId))
  }
  // La reprise remplace les montants vides de l'année par ceux de la précédente.
  const copyPreviousYear = () =>
    onChangeGroups([
      ...feeGroups.filter((feeGroup) => feeGroup.school_year !== feeYear),
      ...copiedGroups,
    ])

  return (
    <>
      <ChoiceField
        icon={CalendarDays}
        label={t('form.rows.schoolYear')}
        placeholder={t('form.choose')}
        options={openSchoolYears.map((schoolYear) => ({ id: schoolYear, name: schoolYear }))}
        value={feeYear}
        isClearable={false}
        onChange={onChangeYear}
      />

      {canCopyPreviousYear && (
        <div className="rounded-control border border-line bg-paper p-4">
          <p className="text-sm text-ink-soft">
            {t('form.feeGroups.copyHint', { year: feeYear, previousYear })}
          </p>
          <Button variant="secondary" onClick={copyPreviousYear} className="mt-3">
            <Copy aria-hidden="true" className="size-4" />
            {t('form.feeGroups.copy', { year: previousYear })}
          </Button>
        </div>
      )}

      <ul className="space-y-3">
        {yearGroups.map((feeGroup, groupIndex) => (
          <FeeGroupCard
            key={feeGroup.groupId}
            feeGroup={feeGroup}
            number={groupIndex + 1}
            levelSections={buildLevelSections(
              listSelectableLevels(levels, feeGroup, feeGroups, offeredLevelIds),
              translateStage,
            )}
            paymentMethods={paymentMethods}
            errorFor={errorFor}
            onChange={(changes) => changeGroup(feeGroup.groupId, changes)}
            onRemove={() => removeGroup(feeGroup)}
          />
        ))}
      </ul>
      <AddRowButton
        label={t('form.feeGroups.add')}
        onAdd={() => onChangeGroups([...feeGroups, createFeeGroup(feeYear)])}
      />
    </>
  )
}

export default FeeGroupsEditor
