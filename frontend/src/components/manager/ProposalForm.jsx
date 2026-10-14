import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from '../ui/Button'
import Notice from '../workspace/Notice'
import { cleanDraftForSchoolProfile } from './proposal-form/draftCleanup'
import { findOfferedChoices } from './proposal-form/offeredChoices'
import { buildProposalContent } from './proposal-form/proposalDraft'
import { validateStep } from './proposal-form/proposalValidation'
import { STEPS } from './proposal-form/steps'
import { useFileUpload } from './proposal-form/useFileUpload'
import { useProposalDraft } from './proposal-form/useProposalDraft'
import { useToast } from '../workspace/toastContext'
import { typeSupportsPrograms } from '../../utils/establishmentType'

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

// Formulaire pas à pas d'une proposition : création d'un établissement ou
// modification d'une fiche existante. Rien n'est écrit sur la fiche ici, le
// contenu part en validation.
function ProposalForm({ mode, meta, school = null, submitting, serverError, onSubmit, onClose }) {
  const { t } = useTranslation('manager')
  const isCreation = mode === 'creation'
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  // Les erreurs ne s'affichent qu'après un essai d'avancer : rouge partout dès
  // l'ouverture, le formulaire accuserait le responsable avant qu'il ait saisi.
  const [hasTriedStep, setHasTriedStep] = useState(false)
  const { draft, setField, setValue, setList, replaceDraft } = useProposalDraft(
    school,
    meta.programs ?? [],
  )
  const upload = useFileUpload()
  const showToast = useToast()

  const offeredChoices = findOfferedChoices(meta, school, draft.fields)
  const visibleSteps = listVisibleSteps(isCreation, offeredChoices, draft)
  const currentStep = visibleSteps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === visibleSteps.length - 1
  const openSchoolYears = meta.coherence_rules?.open_school_years ?? []
  const stepErrors = validateStep(currentStep.id, draft, {
    isCreation,
    openSchoolYears,
    allowedLevelIds: unionOf(offeredChoices.offeredLevelIds, offeredChoices.publishedLevelIds),
    allowedExamIds: unionOf(offeredChoices.offeredExamIds, offeredChoices.publishedExamIds),
  })
  const hasStepErrors = Object.keys(stepErrors).length > 0
  const isBusy = submitting || upload.isUploading
  const fieldError = (fieldPath) =>
    hasTriedStep && stepErrors[fieldPath] ? t(`form.errors.${stepErrors[fieldPath]}`) : undefined
  // Le type et la section commandent la suite du formulaire : en changer
  // retire les classes, les examens et les filières qui ne conviennent plus,
  // et je le dis, pour que rien ne disparaisse en silence.
  const setSchoolProfileField = (fieldName, fieldValue) => {
    const nextFields = { ...draft.fields, [fieldName]: fieldValue }
    const nextChoices = findOfferedChoices(meta, school, nextFields)
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

  const form = {
    draft,
    meta,
    isCreation,
    upload,
    offeredChoices,
    openSchoolYears,
    setField,
    setSchoolProfileField,
    setValue,
    setList,
    fieldError,
  }

  const goToStep = (stepIndex) => {
    setHasTriedStep(false)
    setCurrentStepIndex(stepIndex)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    // La touche Entrée soumet le formulaire même quand le bouton est désactivé.
    if (isBusy) return
    if (hasStepErrors) {
      setHasTriedStep(true)
      return
    }
    if (!isLastStep) {
      goToStep(currentStepIndex + 1)
      return
    }
    onSubmit(
      buildProposalContent(draft, isCreation, {
        publishedFees: school?.detail?.fees ?? [],
        openSchoolYears,
      }),
    )
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

        <section className="min-w-0 rounded-panel border border-line bg-surface p-5 shadow-soft sm:p-8">
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
