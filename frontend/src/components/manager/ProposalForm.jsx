import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, RotateCcw, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from '../ui/Button'
import Notice from '../workspace/Notice'
import { cleanDraftForSchoolProfile } from './proposal-form/draftCleanup'
import { findDraftKey, forgetDraft, readSavedDraft, saveDraft } from './proposal-form/draftStorage'
import { findOfferedChoices } from './proposal-form/offeredChoices'
import { buildProposalContent, buildPublishedRecord } from './proposal-form/proposalDraft'
import { validateStep } from './proposal-form/proposalValidation'
import { revealFirstError } from './proposal-form/revealFirstError'
import { STEPS } from './proposal-form/steps'
import { useFileUpload } from './proposal-form/useFileUpload'
import { useProposalDraft } from './proposal-form/useProposalDraft'
import { useToast } from '../workspace/toastContext'
import { typeSupportsPrograms } from '../../utils/establishmentType'
import { pickHeadTitleForType } from '../../utils/headTitle'

const PERCENT = 100
const ICON_TONE_CLASSES = {
  blue: 'bg-primary-soft text-primary-deep',
  amber: 'bg-warning-soft text-warning',
  green: 'bg-success-soft text-success',
  violet: 'bg-violet-soft text-violet-deep',
}

// Une étape sans rien à y saisir pour ce type d'établissement disparaît : pas
// de résultats d'examens pour une maternelle. Elle reste tant qu'elle contient
// des lignes, pour qu'un résultat saisi avant un changement de type ne parte
// pas sans avoir été revu.
function listVisibleSteps(isCreation, offeredChoices, draft) {
  const stepVisibility = {
    // Les médias d'une fiche existante se gèrent depuis sa page de détail.
    media: isCreation,
    programmes: typeSupportsPrograms(offeredChoices.typeName),
    results: offeredChoices.offeredExamIds.size > 0 || draft.examResultRows.length > 0,
  }
  return STEPS.filter((step) => stepVisibility[step.id] ?? true)
}

function unionOf(firstIds, secondIds) {
  return new Set([...firstIds, ...secondIds])
}

// Bandeau du formulaire : ce qu'on propose, et où on en est.
function FormHero({ title, description, currentStepIndex, stepCount }) {
  const { t } = useTranslation('manager')

  return (
    <section className="rounded-panel bg-linear-to-br from-primary-deep to-violet-deep p-6 text-white shadow-glow sm:p-8">
      <h2 className="font-display text-3xl leading-display text-balance">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-white text-pretty">{description}</p>
      <p className="mt-5 text-sm font-semibold">
        {t('form.step', { current: currentStepIndex + 1, total: stepCount })}
      </p>
      <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full bg-white/25">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${((currentStepIndex + 1) / stepCount) * PERCENT}%` }}
        />
      </div>
    </section>
  )
}

function StepMarker({ stepIndex, currentStepIndex }) {
  if (stepIndex < currentStepIndex) {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-white">
        <Check aria-hidden="true" className="size-4" />
      </span>
    )
  }
  const isCurrent = stepIndex === currentStepIndex
  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        isCurrent
          ? 'bg-linear-to-br from-primary to-violet-deep text-white'
          : 'border border-line text-ink-soft'
      }`}
    >
      {stepIndex + 1}
    </span>
  )
}

// Liste des étapes, sur grand écran. On peut revenir à une étape déjà faite ;
// les suivantes s'ouvrent en avançant, pour passer par les champs obligatoires.
function StepList({ steps, currentStepIndex, onSelectStep }) {
  const { t } = useTranslation('manager')

  return (
    <ol className="hidden rounded-panel border border-line bg-surface p-3 shadow-soft xl:block">
      {steps.map((step, stepIndex) => {
        const isCurrent = stepIndex === currentStepIndex
        return (
          <li key={step.id}>
            <button
              type="button"
              aria-current={isCurrent ? 'step' : undefined}
              disabled={stepIndex > currentStepIndex}
              onClick={() => onSelectStep(stepIndex)}
              className={`flex min-h-12 w-full items-center gap-3 rounded-control px-3 text-left text-sm transition-colors ${
                isCurrent ? 'bg-primary-soft font-bold text-primary-deep' : 'font-medium text-navy'
              } ${stepIndex < currentStepIndex ? 'cursor-pointer hover:bg-muted' : ''} ${
                stepIndex > currentStepIndex ? 'text-ink-soft' : ''
              }`}
            >
              <StepMarker stepIndex={stepIndex} currentStepIndex={currentStepIndex} />
              {t(`form.steps.${step.id}.title`)}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function StepHeader({ step }) {
  const { t } = useTranslation('manager')
  const Icon = step.icon

  return (
    <div className="flex items-start gap-4">
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-control ${ICON_TONE_CLASSES[step.tone]}`}
      >
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-2xl leading-display text-navy">{t(`form.steps.${step.id}.title`)}</h3>
        <p className="mt-1 text-sm text-ink-soft text-pretty">{t(`form.steps.${step.id}.lead`)}</p>
      </div>
    </div>
  )
}

// Avis affiché à l'ouverture quand une saisie de l'onglet a été reprise, ou
// écartée parce que la fiche a changé depuis.
function SavedDraftNotice({ savedDraftOnOpen, isCreation, onStartOver }) {
  const { t } = useTranslation('manager')

  if (savedDraftOnOpen.isOutdated) {
    return <Notice className="mb-6">{t('form.savedDraft.outdated')}</Notice>
  }
  return (
    <Notice className="mb-6">
      {t('form.savedDraft.restored')}
      <Button variant="secondary" onClick={onStartOver} className="mt-3 w-full sm:w-auto">
        <RotateCcw aria-hidden="true" className="size-4" />
        {isCreation ? t('form.savedDraft.clear') : t('form.savedDraft.startOver')}
      </Button>
    </Notice>
  )
}

// Formulaire pas à pas d'une proposition : création d'un établissement ou
// modification d'une fiche existante. Rien n'est écrit sur la fiche ici, le
// contenu part en validation. onDirtyChange dit à la page s'il y a une saisie
// à ne pas perdre en la quittant.
function ProposalForm({
  mode,
  meta,
  school = null,
  submitting,
  serverError,
  onSubmit,
  onClose,
  onDirtyChange,
}) {
  const { t } = useTranslation('manager')
  const isCreation = mode === 'creation'
  const draftKey = findDraftKey(school)
  const [savedDraftOnOpen] = useState(() =>
    readSavedDraft(draftKey, school?.detail?.updated_at ?? null),
  )
  const [isSavedDraftNoticeShown, setIsSavedDraftNoticeShown] = useState(
    savedDraftOnOpen.savedDraft !== null || savedDraftOnOpen.isOutdated,
  )
  const { draft, setField, setValue, replaceDraft, resetDraft } = useProposalDraft(
    school,
    meta,
    savedDraftOnOpen.savedDraft?.draft,
  )
  // La saisie reprise rouvre l'étape où le responsable s'était arrêté, bornée
  // aux étapes que son brouillon affiche.
  const [currentStepIndex, setCurrentStepIndex] = useState(() =>
    Math.min(
      savedDraftOnOpen.savedDraft?.stepIndex ?? 0,
      listVisibleSteps(isCreation, findOfferedChoices(meta, school, draft.fields), draft).length - 1,
    ),
  )
  // Les erreurs ne s'affichent qu'après un essai d'avancer : rouge partout dès
  // l'ouverture, le formulaire accuserait le responsable avant qu'il ait saisi.
  const [hasTriedStep, setHasTriedStep] = useState(false)
  // Chaque essai refusé incrémente ce compteur : l'effet ci-dessous montre la
  // première erreur une fois qu'elle est affichée.
  const [errorRevealCount, setErrorRevealCount] = useState(0)
  const stepSectionRef = useRef(null)
  const upload = useFileUpload()
  const showToast = useToast()

  const offeredChoices = findOfferedChoices(meta, school, draft.fields)
  const visibleSteps = listVisibleSteps(isCreation, offeredChoices, draft)
  const currentStep = visibleSteps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === visibleSteps.length - 1
  const openSchoolYears = meta.coherence_rules?.open_school_years ?? []
  const publishedRecord = buildPublishedRecord(school, meta.programs)
  const stepErrors = validateStep(currentStep.id, draft, {
    isCreation,
    openSchoolYears,
    publishedFields: publishedRecord.fields,
    allowedLevelIds: unionOf(offeredChoices.offeredLevelIds, offeredChoices.publishedLevelIds),
    allowedExamIds: unionOf(offeredChoices.offeredExamIds, offeredChoices.publishedExamIds),
  })
  const hasStepErrors = Object.keys(stepErrors).length > 0
  const isBusy = submitting || upload.isUploading
  const fieldError = (fieldPath) =>
    hasTriedStep && stepErrors[fieldPath] ? t(`form.errors.${stepErrors[fieldPath]}`) : undefined
  // Le type et la section commandent la suite du formulaire : en changer
  // retire les classes, les examens et les filières qui ne conviennent plus,
  // et je le dis, pour que rien ne disparaisse en silence. Le titre du chef
  // d'établissement suit le type lui aussi.
  const setSchoolProfileField = (fieldName, fieldValue) => {
    const changedFields = { ...draft.fields, [fieldName]: fieldValue }
    const nextChoices = findOfferedChoices(meta, school, changedFields)
    const headTitlesByType = meta.coherence_rules?.head_titles ?? {}
    const nextFields = {
      ...changedFields,
      director_title: pickHeadTitleForType(
        draft.fields.director_title,
        headTitlesByType[offeredChoices.typeName],
        headTitlesByType[nextChoices.typeName],
      ),
    }
    const cleanup = cleanDraftForSchoolProfile(
      { ...draft, fields: nextFields },
      {
        levelIds: unionOf(nextChoices.offeredLevelIds, nextChoices.publishedLevelIds),
        examIds: unionOf(nextChoices.offeredExamIds, nextChoices.publishedExamIds),
        supportsPrograms: typeSupportsPrograms(nextChoices.typeName),
      },
    )
    replaceDraft(cleanup.draft)
    if (cleanup.hasRemovedSomething) {
      showToast({ tone: 'success', message: t('form.cleanedAfterProfileChange') })
    }
  }

  // Ce qui part est ce qui diffère de la fiche publiée : une modification sans
  // changement n'a rien à faire valider, l'étape de relecture le dit.
  const proposalContent = buildProposalContent(draft, { ...publishedRecord, openSchoolYears })
  const hasNothingToSend = !isCreation && Object.keys(proposalContent).length === 0
  // Une saisie est à protéger dès qu'elle partirait : un formulaire ouvert puis
  // laissé tel quel ne demande ni sauvegarde ni confirmation.
  const isDirty = Object.keys(proposalContent).length > 0

  const form = {
    draft,
    meta,
    proposalContent,
    hasNothingToSend,
    isCreation,
    upload,
    offeredChoices,
    openSchoolYears,
    setField,
    setSchoolProfileField,
    setValue,
    fieldError,
  }

  useEffect(() => {
    if (errorRevealCount > 0) revealFirstError(stepSectionRef.current)
  }, [errorRevealCount])

  useEffect(() => {
    if (!isDirty) {
      forgetDraft(draftKey)
      return
    }
    saveDraft(draftKey, {
      profileVersion: school?.detail?.updated_at ?? null,
      stepIndex: currentStepIndex,
      draft,
    })
  }, [draft, currentStepIndex, isDirty, draftKey, school])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  // Fermer ou recharger l'onglet : le navigateur demande confirmation. Sur
  // téléphone il ne le fait pas toujours, d'où la sauvegarde ci-dessus.
  useEffect(() => {
    if (!isDirty) return undefined
    const warnBeforeLeaving = (event) => event.preventDefault()
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [isDirty])

  // La carte de l'étape reste la même d'une étape à l'autre : je ramène son
  // haut à l'écran, la suivante se lit depuis son titre.
  // L'avis de saisie reprise ne sert qu'à l'ouverture : il part à l'étape suivante.
  const goToStep = (stepIndex) => {
    setHasTriedStep(false)
    setIsSavedDraftNoticeShown(false)
    setCurrentStepIndex(stepIndex)
    stepSectionRef.current?.scrollIntoView({ block: 'start' })
  }

  const startOver = () => {
    resetDraft()
    forgetDraft(draftKey)
    goToStep(0)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    // La touche Entrée soumet le formulaire même quand le bouton est désactivé.
    if (isBusy) return
    if (hasStepErrors) {
      setHasTriedStep(true)
      setErrorRevealCount((count) => count + 1)
      return
    }
    if (!isLastStep) {
      goToStep(currentStepIndex + 1)
      return
    }
    if (hasNothingToSend) return
    onSubmit(proposalContent)
  }

  return (
    // noValidate : sans lui, le navigateur affiche ses propres bulles, dans sa
    // langue à lui, avant mes messages.
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      <FormHero
        title={isCreation ? t('form.newSchool') : school.name}
        description={
          isCreation
            ? t('form.creationLead')
            : t('form.modificationLead')
        }
        currentStepIndex={currentStepIndex}
        stepCount={visibleSteps.length}
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <StepList
          steps={visibleSteps}
          currentStepIndex={currentStepIndex}
          onSelectStep={goToStep}
        />

        <section
          ref={stepSectionRef}
          className="min-w-0 scroll-mt-28 rounded-panel border border-line bg-surface p-5 shadow-soft sm:p-8"
        >
          {isSavedDraftNoticeShown && (
            <SavedDraftNotice
              savedDraftOnOpen={savedDraftOnOpen}
              isCreation={isCreation}
              onStartOver={startOver}
            />
          )}
          <StepHeader step={currentStep} />
          <div className="mt-6 space-y-4">
            <currentStep.Component form={form} />
          </div>

          {hasTriedStep && hasStepErrors && (
            <Notice tone="danger" className="mt-6">
              {t('form.errors.stepHasErrors')}
            </Notice>
          )}

          {serverError && (
            <Notice tone="danger" className="mt-6">
              {serverError}
            </Notice>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={isFirstStep ? onClose : () => goToStep(currentStepIndex - 1)}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {isFirstStep ? t('actions.cancel') : t('form.back')}
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={isBusy}
            >
              {isLastStep ? (
                <>
                  <Send aria-hidden="true" className="size-4" />
                  {submitting ? t('form.sending') : t('actions.sendForReview')}
                </>
              ) : (
                <>
                  {t('form.next')}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </>
              )}
            </Button>
          </div>
        </section>
      </div>
    </form>
  )
}

export default ProposalForm
